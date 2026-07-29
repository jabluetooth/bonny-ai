import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import { InferenceClient } from '@huggingface/inference'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from './supabase-admin'
import { embedProjectRecord } from './embeddings'

export interface RepoPushContext {
    repoFullName: string
    repoUrl: string
    repoDescription: string | null
    defaultBranch: string
    readme: string | null
    packageJson: string | null
    commitMessages: string[]
    deliveryId: string
}

const SYSTEM_PROMPT = `You maintain the "projects" section of a software engineer's portfolio website, stored in a Supabase database.

You will be given context about a GitHub push: the repository name, URL, description, recent commit messages, README.md content, and package.json content.

Your job:
1. Call list_projects to see existing portfolio entries.
2. Decide whether this repo already has a matching entry — match strictly by github_url, never by title or fuzzy similarity.
3. Call upsert_project to create a new entry (if none matches) or update the existing one (if one matches).

Rules:
- Only include fields in upsert_project that you have real evidence for from the provided context. Never invent features, technologies, or "challenges learned" that aren't supported by the README or package.json.
- Write descriptions in a concise, confident, first-person-adjacent developer voice — 1 to 3 sentences.
- tech_stack should reflect actual dependencies/languages evidenced in package.json or the README, not guesses.
- If the push looks trivial (typo fix, dependency bump, CI config change) and there's nothing meaningful to add, it's fine to make a minimal update or none at all — you don't have to call upsert_project if nothing should change.
- Never clear a field you don't have new information for — omit it from the upsert_project call instead so it stays unchanged.
- Once you've made your decision and (if needed) called upsert_project, reply with a brief final summary of what you did. Do not keep calling tools after the update is made.`

const MAX_ITERATIONS = 6

// Groq's OpenAI-compatible tool-calling format.
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'list_projects',
            description:
                'List all existing portfolio projects (id, title, github_url, description, type, tech_stack, status). ' +
                'Always call this first to check whether the pushed repo already has a matching entry (match by github_url) ' +
                'before deciding whether to create a new project or update an existing one.',
            parameters: {
                type: 'object',
                properties: {},
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'upsert_project',
            description:
                'Create or update a portfolio project. Matches an existing project by exact github_url; if none matches, ' +
                'creates a new one (title and description are then required). Only include fields you want to change — ' +
                'omitted fields are left untouched on an update. Never invent details not evidenced in the provided repo context.',
            parameters: {
                type: 'object',
                properties: {
                    github_url: { type: 'string', description: 'The exact GitHub repository URL — this is the match key.' },
                    title: { type: 'string' },
                    description: { type: 'string', description: 'Short 1-3 sentence summary, written in a confident first-person-adjacent developer voice.' },
                    type: {
                        type: 'string',
                        enum: ['Web Development', 'AI & ML', 'Mobile App', 'Data Science', 'Other'],
                    },
                    key_features: { type: 'array', items: { type: 'string' } },
                    tech_stack: { type: 'array', items: { type: 'string' }, description: 'Languages/frameworks evidenced in package.json or the README.' },
                    challenges_learned: { type: 'string' },
                    status: { type: 'string', enum: ['Work in progress', 'Online', 'Down'] },
                },
                required: ['github_url'],
                additionalProperties: false,
            },
        },
    },
]

interface ToolResult {
    isError?: boolean
    [key: string]: unknown
}

interface ToolContext {
    supabase: SupabaseClient
    hf: InferenceClient
    ctx: RepoPushContext
    sessionId: string
}

async function listProjects(supabase: SupabaseClient): Promise<ToolResult> {
    const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, type, github_url, status, project_skills(skills(name))')

    if (error) return { isError: true, error: error.message }

    const projects = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        github_url: p.github_url,
        status: p.status,
        tech_stack: (p.project_skills || []).map((ps: any) => ps.skills?.name).filter(Boolean),
    }))

    return { projects }
}

async function syncTechStack(supabase: SupabaseClient, projectId: string, techStack: string[]): Promise<void> {
    const { error: deleteError } = await supabase.from('project_skills').delete().eq('project_id', projectId)
    if (deleteError) console.error('[agent-session] failed clearing old skill links:', deleteError.message)

    for (const rawTech of techStack) {
        const name = rawTech.trim()
        if (!name) continue

        let skillId: string | undefined

        const { data: existingSkill } = await supabase.from('skills').select('id').ilike('name', name).maybeSingle()
        if (existingSkill) {
            skillId = existingSkill.id
        } else {
            const { data: newSkill, error: insertError } = await supabase.from('skills').insert({ name }).select().single()
            if (newSkill) {
                skillId = newSkill.id
            } else if (insertError) {
                // Race with another writer — check again before giving up.
                const { data: retry } = await supabase.from('skills').select('id').ilike('name', name).maybeSingle()
                if (retry) skillId = retry.id
            }
        }

        if (skillId) {
            const { error: linkError } = await supabase.from('project_skills').insert({ project_id: projectId, skill_id: skillId })
            if (linkError) console.error(`[agent-session] failed linking skill "${name}":`, linkError.message)
        }
    }
}

async function upsertProject(input: any, { supabase, hf, ctx, sessionId }: ToolContext): Promise<ToolResult> {
    const githubUrl: string | undefined = input?.github_url
    if (!githubUrl) return { isError: true, error: 'github_url is required' }

    const { data: existing, error: findError } = await supabase
        .from('projects')
        .select('*')
        .eq('github_url', githubUrl)
        .maybeSingle()

    if (findError) return { isError: true, error: findError.message }

    const before = existing ? { ...existing } : null

    const fields: Record<string, unknown> = { github_url: githubUrl, updated_at: new Date().toISOString() }
    for (const key of ['title', 'description', 'type', 'key_features', 'challenges_learned', 'status'] as const) {
        if (input[key] !== undefined) fields[key] = input[key]
    }

    let projectId: string
    let action: 'created' | 'updated'

    if (existing) {
        const { error: updateError } = await supabase.from('projects').update(fields).eq('id', existing.id)
        if (updateError) return { isError: true, error: updateError.message }
        projectId = existing.id
        action = 'updated'
    } else {
        if (!input.title || !input.description) {
            return { isError: true, error: 'title and description are required to create a new project' }
        }
        const { data: inserted, error: insertError } = await supabase
            .from('projects')
            .insert({ ...fields, status: fields.status || 'Work in progress' })
            .select()
            .single()
        if (insertError) return { isError: true, error: insertError.message }
        projectId = inserted.id
        action = 'created'
    }

    if (Array.isArray(input.tech_stack)) {
        await syncTechStack(supabase, projectId, input.tech_stack)
    }

    const { data: after } = await supabase.from('projects').select('*').eq('id', projectId).single()

    const { error: logError } = await supabase.from('content_edits_log').insert({
        table_name: 'projects',
        record_id: projectId,
        action,
        before,
        after,
        github_delivery_id: ctx.deliveryId,
        session_id: sessionId,
    })
    if (logError) console.error('[agent-session] failed writing audit log:', logError.message)

    try {
        await embedProjectRecord(supabase, hf, {
            ...after,
            tech_stack: Array.isArray(input.tech_stack) ? input.tech_stack : after?.tech_stack,
        })
    } catch (embedError) {
        console.error('[agent-session] re-embed failed:', embedError)
    }

    return { id: projectId, action }
}

async function handleCustomTool(name: string, input: unknown, toolCtx: ToolContext): Promise<ToolResult> {
    switch (name) {
        case 'list_projects':
            return listProjects(toolCtx.supabase)
        case 'upsert_project':
            return upsertProject(input, toolCtx)
        default:
            return { isError: true, error: `Unknown tool: ${name}` }
    }
}

function buildKickoffMessage(ctx: RepoPushContext): string {
    return `A push was just made to the GitHub repository below. Review the context, call list_projects to check ` +
        `for an existing entry matching this github_url, then call upsert_project to create or update the portfolio ` +
        `entry accordingly. Only change fields you have real evidence for — do not invent features, technologies, ` +
        `or challenges that aren't supported by the README or package.json below.

Repository: ${ctx.repoFullName}
GitHub URL: ${ctx.repoUrl}
Repo description (from GitHub): ${ctx.repoDescription || '(none)'}
Default branch: ${ctx.defaultBranch}

Recent commit messages:
${ctx.commitMessages.length > 0 ? ctx.commitMessages.map((m) => `- ${m}`).join('\n') : '(none)'}

README.md:
${ctx.readme ? ctx.readme.slice(0, 8000) : '(not found)'}

package.json:
${ctx.packageJson ? ctx.packageJson.slice(0, 4000) : '(not found)'}
`
}

/**
 * Runs one end-to-end content-sync turn for a GitHub push: drives a manual
 * tool-calling loop against Groq (OpenAI-compatible), executing the two
 * custom tools against Supabase as the model calls them, until it stops
 * calling tools or MAX_ITERATIONS is hit. Intended to run in the background
 * (e.g. inside Next.js `after()`), not on the request's critical path.
 */
export async function runContentAgentSession(ctx: RepoPushContext): Promise<void> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured — the content agent needs it to run.')
    }

    const model = process.env.AGENT_GROQ_MODEL || 'llama-3.3-70b-versatile'
    const groq = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' })
    const supabase = createAdminClient()
    const hf = new InferenceClient(process.env.HF_API_KEY || undefined)
    const sessionId = randomUUID()

    const toolCtx: ToolContext = { supabase, hf, ctx, sessionId }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildKickoffMessage(ctx) },
    ]

    console.log(`[agent-session] starting content sync for ${ctx.repoFullName} (session ${sessionId})`)

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const completion = await groq.chat.completions.create({
            model,
            messages,
            tools: TOOLS,
            tool_choice: 'auto',
            temperature: 0.3,
        })

        const message = completion.choices[0]?.message
        if (!message) break

        messages.push(message)

        const toolCalls = message.tool_calls
        if (!toolCalls || toolCalls.length === 0) {
            console.log(`[agent-session] session ${sessionId} finished: ${(message.content || '').slice(0, 300)}`)
            break
        }

        for (const toolCall of toolCalls) {
            if (toolCall.type !== 'function') continue

            let parsedInput: unknown = {}
            try {
                parsedInput = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {}
            } catch {
                parsedInput = {}
            }

            const result = await handleCustomTool(toolCall.function.name, parsedInput, toolCtx)
            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
            })
        }
    }

    console.log(`[agent-session] finished content sync for ${ctx.repoFullName} (session ${sessionId})`)
}
