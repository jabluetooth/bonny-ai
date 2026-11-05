import OpenAI from 'openai';
import { observeOpenAI } from '@langfuse/openai';
import { startActiveObservation, propagateAttributes, type LangfuseSpan } from '@langfuse/tracing';

// --- Data Interfaces ---
export interface ProjectContext {
    title: string;
    description: string;
    tech_stack: string[];
    industry?: string;
    problem?: string;
    solution?: string;
    results?: string[];
    features?: string[];
    url?: string;
    github?: string;
}

export interface ServiceContext {
    title: string;
    problem: string;
    solution: string;
    outcome: string;
}

export interface SkillContext {
    name: string;
    category?: string;
    description?: string;
}

export interface ExperienceContext {
    company: string;
    role: string;
    date: string;
    description: string[];
    type?: string;
}

export interface ProfileContext {
    content: string;
    headline?: string;
}

export interface ContactLinkContext {
    platform: string;
    url: string;
}

export interface LLMContext {
    userName?: string;
    services?: ServiceContext[];
    projects?: ProjectContext[];
    skills?: SkillContext[];
    experience?: ExperienceContext[];
    about?: ProfileContext[];
    contactLinks?: ContactLinkContext[];
}

export interface LLMTraceContext {
    /** Groups every turn of a conversation into one Langfuse session. */
    sessionId?: string;
    /** The authenticated visitor, for per-user filtering in Langfuse. */
    userId?: string;
}


// Helper to format context as token-efficient plain text
function formatContext(data: LLMContext): string {
    let output = "";
    if (data.userName && data.userName !== "Guest") output += `Visitor name = ${data.userName}\n`;

    if (data.about && data.about.length > 0) {
        output += "\n-- ABOUT ME --\n";
        data.about.forEach(a => {
            if (a.headline) output += `${a.headline}\n`;
            output += `${a.content}\n`;
        });
    }

    if (data.services && data.services.length > 0) {
        output += "\n-- SERVICES (problem -> solution -> outcome) --\n";
        data.services.forEach(s => {
            output += `- ${s.title}\n  Problem. ${s.problem}\n  Solution. ${s.solution}\n  Outcome. ${s.outcome}\n`;
        });
    }

    if (data.projects && data.projects.length > 0) {
        output += "\n-- CASE STUDIES --\n";
        data.projects.forEach(p => {
            output += `- ${p.title}${p.industry ? ` [${p.industry}]` : ''}\n`;
            if (p.problem) output += `  Problem. ${p.problem}\n`;
            if (p.solution) output += `  Solution. ${p.solution}\n`;
            if (p.results && p.results.length > 0) output += `  Results. ${p.results.join('; ')}\n`;
            if (!p.problem && !p.solution) output += `  Summary. ${p.description}\n`;
            if (p.tech_stack.length > 0) output += `  Built with ${p.tech_stack.join(', ')}\n`;
        });
    }

    if (data.skills && data.skills.length > 0) {
        output += "\n-- SKILLS --\n";
        const grouped = data.skills.reduce((acc, skill) => {
            const cat = skill.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(skill.name);
            return acc;
        }, {} as Record<string, string[]>);

        Object.entries(grouped).forEach(([cat, names]) => {
            output += `${cat} = ${names.join(', ')}\n`;
        });
    }

    if (data.experience && data.experience.length > 0) {
        output += "\n-- EXPERIENCE --\n";
        data.experience.forEach(e => {
            output += `- ${e.role} @ ${e.company} (${e.date})\n  ${e.description.join(' ')}\n`;
        });
    }

    if (data.contactLinks && data.contactLinks.length > 0) {
        output += "\n-- CONTACT LINKS --\n";
        data.contactLinks.forEach(l => {
            output += `- ${l.platform} ${l.url}\n`;
        });
    }

    return output;
}

function buildSystemPrompt(context: LLMContext, ragContext?: string): string {
    return `
You are Fil Heinz O. Re La Torre, an Automation and AI Solutions Engineer. This website is your portfolio, and you are speaking with a visitor in the first person.

WHO YOU ARE TALKING TO
Visitors are usually one of two people. A business owner or operator who wants to fix a problem, save time, or grow revenue. Or a recruiter or hiring manager assessing whether you can deliver results for their team. Read the question and answer for the person asking. If it is unclear, lead with business value, since that serves both.

HOW TO ANSWER
1. Speak as Fil in the first person ("I built", "my approach"). Never say you are an AI, an assistant, or "the developer".
2. Be serious, direct and specific. No emojis, no exclamation marks, no hype words such as "passionate", "exciting" or "innovative".
3. Frame substantive answers as problem, then solution, then result. Name the business problem in plain language, explain what you would build or did build, and state the outcome. Use numbers only when they appear in the context below.
4. Talk about outcomes before technology. Mention tools only when they help the visitor understand the solution or when they ask about the stack.
5. Keep it short. Two to five sentences, or a brief list. Use **bold** for the key point only.
6. When a visitor describes a problem in their own business, relate it to a relevant service or case study from the context, explain how you would approach it in a few steps, and invite them to start a conversation.
7. Close substantive answers with one clear next step, such as viewing a relevant case study or getting in touch. Do not repeat a call to action in every message.
8. Use only the context below. If something is not covered, say so honestly and offer to discuss it directly. Never invent clients, numbers or projects.
9. Do not start with a title, a header, or your own name.

VISUAL COMPONENTS
You can show one interface block by adding exactly one tag to your reply. When you add a tag, keep the text to one or two sentences because the block carries the detail.
- [[SHOW_SERVICES]] shows the problems I solve. Use it for questions about services, what I offer, or how I can help a business.
- [[SHOW_PROJECTS]] shows all case studies. [[SHOW_PROJECTS:WEB]] and [[SHOW_PROJECTS:AI]] filter them.
- [[SHOW_CONTACT]] shows the contact options. Use it when the visitor wants to hire, book a call, get a quote, or get in touch.
- [[SHOW_SKILLS]] shows the full stack. [[CATEGORY: Frontend]] or [[SKILL: React]] narrow it.
- [[SHOW_EXPERIENCE:WORK]] and [[SHOW_EXPERIENCE:EDUCATION]] show work history and education.
- [[SHOW_ABOUT]] shows my profile card.
Only show projects for questions about work or results, and only show skills for questions about technology.

CONTEXT
${formatContext(context)}
${ragContext ? `\nRELEVANT DATABASE MATCHES (use these for specific details)\n${ragContext}` : ''}
`;
}

function llmConfig() {
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined;
    // gpt-oss-20b is blocked in this Groq org; override with GROQ_MODEL.
    const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    return { apiKey, baseURL, model: baseURL ? groqModel : 'gpt-4o-mini' };
}

function tracedClient(apiKey: string, baseURL: string | undefined, traceContext?: LLMTraceContext) {
    return observeOpenAI(new OpenAI({ apiKey, baseURL }), {
        generationName: 'portfolio-chat-response',
        sessionId: traceContext?.sessionId,
        userId: traceContext?.userId,
        tags: ['portfolio-chat', baseURL ? 'groq' : 'openai'],
    });
}

const MISSING_KEY_REPLY = "I'm currently unable to process requests due to a configuration error (Missing API Key).";
const UNAVAILABLE_REPLY = "I'm temporarily unavailable. Please try again in a moment.";

export async function generateLLMResponse(
    userMessage: string,
    context: LLMContext,
    ragContext?: string,
    traceContext?: LLMTraceContext
): Promise<string> {
    // One trace per chatbot turn (best practice: a trace is "one
    // self-contained unit of work"). Root input/output stay human-readable
    // (just the user message / final reply) so a reviewer can scan the
    // Traces view at a glance; the full system prompt + RAG context lives on
    // the nested generation below, captured automatically by observeOpenAI.
    return propagateAttributes(
        {
            traceName: 'portfolio-chat-turn',
            sessionId: traceContext?.sessionId,
            userId: traceContext?.userId,
            tags: ['portfolio-chat'],
        },
        () => startActiveObservation('portfolio-chat-turn', (span) => runTurn(span))
    );

    async function runTurn(span: LangfuseSpan): Promise<string> {
        span.update({ input: userMessage });

        const { apiKey, baseURL, model } = llmConfig();
        if (!apiKey) {
            console.error('LLM Config Error: No API Key found (GROQ_API_KEY or OPENAI_API_KEY)');
            span.update({ output: MISSING_KEY_REPLY });
            return MISSING_KEY_REPLY;
        }

        try {
            const completion = await tracedClient(apiKey, baseURL, traceContext).chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: buildSystemPrompt(context, ragContext) },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.4,
                max_tokens: 500,
            });

            const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
            span.update({ output: reply });
            return reply;
        } catch (error) {
            console.error('LLM Generation Error:', error);
            span.update({ output: UNAVAILABLE_REPLY });
            return UNAVAILABLE_REPLY;
        }
    }
}

/**
 * Streaming version of generateLLMResponse for the visitor chat: tokens are
 * written to the returned stream as the model produces them, so the reply
 * starts appearing within a few hundred milliseconds instead of after the
 * whole completion.
 *
 * `onComplete` runs with the full reply before the stream closes (so it still
 * runs inside the request), which is where the caller saves the message.
 * Tracing matches the non-streaming path: one Langfuse trace per turn, with
 * the nested generation captured by observeOpenAI.
 */
export function streamLLMResponse(
    userMessage: string,
    context: LLMContext,
    ragContext: string | undefined,
    traceContext: LLMTraceContext | undefined,
    onComplete: (reply: string) => Promise<void>
): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
        start(controller) {
            const run = async (span: LangfuseSpan) => {
                span.update({ input: userMessage });
                let reply = '';
                const { apiKey, baseURL, model } = llmConfig();

                try {
                    if (!apiKey) {
                        console.error('LLM Config Error: No API Key found (GROQ_API_KEY or OPENAI_API_KEY)');
                        reply = MISSING_KEY_REPLY;
                        controller.enqueue(encoder.encode(reply));
                    } else {
                        const stream = await tracedClient(apiKey, baseURL, traceContext).chat.completions.create({
                            model,
                            messages: [
                                { role: 'system', content: buildSystemPrompt(context, ragContext) },
                                { role: 'user', content: userMessage },
                            ],
                            temperature: 0.4,
                            max_tokens: 500,
                            stream: true,
                        });
                        for await (const chunk of stream) {
                            const delta = chunk.choices[0]?.delta?.content;
                            if (delta) {
                                reply += delta;
                                controller.enqueue(encoder.encode(delta));
                            }
                        }
                        if (!reply) {
                            reply = "I'm sorry, I couldn't generate a response.";
                            controller.enqueue(encoder.encode(reply));
                        }
                    }
                } catch (error) {
                    console.error('LLM Streaming Error:', error);
                    // If part of a reply already went out, finish it with a note
                    // rather than replacing what the visitor has read.
                    const tail = reply ? `\n\n_${UNAVAILABLE_REPLY}_` : UNAVAILABLE_REPLY;
                    reply += tail;
                    controller.enqueue(encoder.encode(tail));
                }

                span.update({ output: reply });
                try {
                    await onComplete(reply);
                } catch (err) {
                    console.error('LLM onComplete error:', err);
                }
                controller.close();
            };

            propagateAttributes(
                {
                    traceName: 'portfolio-chat-turn',
                    sessionId: traceContext?.sessionId,
                    userId: traceContext?.userId,
                    tags: ['portfolio-chat', 'streaming'],
                },
                () => startActiveObservation('portfolio-chat-turn', (span) => run(span))
            ).catch((err: unknown) => {
                console.error('LLM trace error:', err);
                try { controller.close(); } catch { /* already closed */ }
            });
        },
    });
}
