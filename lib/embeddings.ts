import type { SupabaseClient } from '@supabase/supabase-js'

// Embeddings come from the `embed` Supabase Edge Function
// (supabase/functions/embed), which runs the built-in gte-small model:
// 384 dimensions, no third-party API or per-call billing. Indexing and
// search must use the same model, so everything goes through here.
export const EMBEDDING_MODEL = 'gte-small'

function embedEndpoint(): { url: string; secret: string } {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    const secret = process.env.EMBED_FUNCTION_SECRET
    if (!base || !secret) {
        throw new Error('Embeddings need NEXT_PUBLIC_SUPABASE_URL and EMBED_FUNCTION_SECRET to be set')
    }
    return { url: `${base.replace(/\/$/, '')}/functions/v1/embed`, secret }
}

/** Embeds up to 64 strings in one call. */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const { url, secret } = embedEndpoint()
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-embed-secret': secret },
        body: JSON.stringify({ input: texts }),
    })
    if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`embed function returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
    }
    const data = (await res.json()) as { embeddings?: number[][] }
    if (!Array.isArray(data.embeddings) || data.embeddings.length !== texts.length) {
        throw new Error('embed function returned an unexpected response')
    }
    return data.embeddings
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const [embedding] = await generateEmbeddings([text])
    return embedding
}

interface EmbeddableProject {
    id: string
    title: string
    type?: string | null
    description?: string | null
    tech_stack?: string[] | null
    challenges_learned?: string | null
    industry?: string | null
    problem?: string | null
    solution?: string | null
    results?: string[] | null
}

interface Chunk {
    content: string
    chunk_type: string
    extraMetadata?: Record<string, unknown>
}

/**
 * Replaces all RAG chunks for one (source_table, record_id) with a fresh
 * set, so incremental updates (e.g. from the GitHub content agent) don't
 * accumulate duplicates the way a full rebuild's upfront wipe does.
 */
async function replaceRecordChunks(
    supabase: SupabaseClient,
    sourceTable: string,
    recordId: string,
    chunks: Chunk[]
): Promise<void> {
    const { error: deleteError } = await supabase
        .from('document_embeddings')
        .delete()
        .eq('metadata->>source_table', sourceTable)
        .eq('metadata->>record_id', recordId)

    if (deleteError) {
        console.error(`[embeddings] failed to clear old ${sourceTable} chunks for ${recordId}:`, deleteError.message)
    }

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.content)
        const { error } = await supabase.from('document_embeddings').insert({
            content: chunk.content,
            embedding,
            metadata: {
                source_table: sourceTable,
                record_id: recordId,
                chunk_type: chunk.chunk_type,
                ...chunk.extraMetadata,
            },
        })
        if (error) {
            console.error(`[embeddings] failed to insert ${chunk.chunk_type} chunk for ${sourceTable} ${recordId}:`, error.message)
        }
    }
}

/**
 * Re-embeds a single project's RAG chunks (overview, tech stack, case study, challenges).
 * Mirrors the per-project chunking scripts/embed-data.ts does during a full rebuild.
 */
export async function embedProjectRecord(
    supabase: SupabaseClient,
    project: EmbeddableProject
): Promise<void> {
    const chunks: Chunk[] = [
        {
            content: `Project: ${project.title}. Type: ${project.type || 'Unknown'}. Description: ${project.description || ''}.`,
            chunk_type: 'overview',
            extraMetadata: { title: project.title },
        },
    ]

    if (project.tech_stack && project.tech_stack.length > 0) {
        chunks.push({
            content: `Project ${project.title} uses the following technologies: ${project.tech_stack.join(', ')}.`,
            chunk_type: 'tech_stack',
            extraMetadata: { title: project.title },
        })
    }

    if (project.problem || project.solution || (project.results && project.results.length > 0)) {
        const parts = [`Case study ${project.title}${project.industry ? ` (${project.industry})` : ''}.`]
        if (project.problem) parts.push(`Business problem. ${project.problem}`)
        if (project.solution) parts.push(`Solution I built. ${project.solution}`)
        if (project.results && project.results.length > 0) parts.push(`Results. ${project.results.join('; ')}`)
        chunks.push({
            content: parts.join(' '),
            chunk_type: 'case_study',
            extraMetadata: { title: project.title },
        })
    }

    if (project.challenges_learned) {
        chunks.push({
            content: `Challenges and learnings from project ${project.title}: ${project.challenges_learned}`,
            chunk_type: 'challenges',
        })
    }

    await replaceRecordChunks(supabase, 'projects', project.id, chunks)
}

interface EmbeddableProfile {
    id: string
    description?: string | null
}

/**
 * Re-embeds the "About Me" bio chunk for the author profile. Mirrors the
 * main_bio chunk scripts/embed-data.ts's processProfiles() produces.
 */
export async function embedProfileRecord(
    supabase: SupabaseClient,
    profile: EmbeddableProfile
): Promise<void> {
    const content = `About Me - Personal Introduction and Biography: ${profile.description || ''}`.trim()
    await replaceRecordChunks(supabase, 'author_profiles', profile.id, [
        { content, chunk_type: 'main_bio' },
    ])
}

interface EmbeddableService {
    id: string
    title: string
    problem?: string | null
    solution?: string | null
    outcome?: string | null
}

/**
 * Re-embeds a single service as one problem -> solution -> outcome chunk,
 * phrased the way a business owner would describe the pain so semantic
 * search matches questions like "we waste hours on manual data entry".
 */
export async function embedServiceRecord(
    supabase: SupabaseClient,
    service: EmbeddableService
): Promise<void> {
    const content = [
        `Service I offer. ${service.title}.`,
        service.problem ? `Problem it solves. ${service.problem}` : '',
        service.solution ? `How I solve it. ${service.solution}` : '',
        service.outcome ? `Business outcome. ${service.outcome}` : '',
    ].filter(Boolean).join(' ')

    await replaceRecordChunks(supabase, 'services', service.id, [
        { content, chunk_type: 'service', extraMetadata: { title: service.title } },
    ])
}
