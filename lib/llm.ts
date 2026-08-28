import OpenAI from 'openai';
import { observeOpenAI } from '@langfuse/openai';
import { startActiveObservation, propagateAttributes, type LangfuseSpan } from '@langfuse/tracing';

// --- Data Interfaces ---
export interface ProjectContext {
    title: string;
    description: string;
    tech_stack: string[];
    features?: string[];
    url?: string;
    github?: string;
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
}

export interface InterestContext {
    title: string;
    description: string;
}

export interface VisionContext {
    quote: string;
    author?: string;
    category?: string;
}

export interface BackgroundContext {
    title: string;
    description: string;
    dateRange?: string;
    category?: string;
}

export interface LLMContext {
    userName?: string;
    projects?: ProjectContext[];
    skills?: SkillContext[];
    experience?: ExperienceContext[];
    about?: ProfileContext[];
    interests?: InterestContext[];
    vision?: VisionContext[];
    background?: BackgroundContext[];
    categories?: string[];
    [key: string]: any; // Allow extensibility
}

export interface LLMTraceContext {
    /** Groups every turn of a conversation into one Langfuse session. */
    sessionId?: string;
    /** The authenticated visitor, for per-user filtering in Langfuse. */
    userId?: string;
}

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

        const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
        const baseURL = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined;

        if (!apiKey) {
            console.error('LLM Config Error: No API Key found (GROQ_API_KEY or OPENAI_API_KEY)');
            const reply = "I'm currently unable to process requests due to a configuration error (Missing API Key).";
            span.update({ output: reply });
            return reply;
        }

        // Helper to format context as token-efficient text (Pseudo-YAML/Markdown)
        const formatContext = (data: LLMContext): string => {
            let output = "";
            if (data.userName) output += `User Name: ${data.userName}\n`;

            if (data?.skills && data.skills.length > 0) {
                output += "\n-- MY SKILLS --\n";
                const grouped = data.skills.reduce((acc, skill) => {
                    const cat = skill.category || 'Other';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(skill.name);
                    return acc;
                }, {} as Record<string, string[]>);

                Object.entries(grouped).forEach(([cat, names]) => {
                    output += `${cat}: ${names.join(', ')}\n`;
                });
            }

            if (data?.projects && data.projects.length > 0) {
                output += "\n-- MY PROJECTS --\n";
                data.projects.forEach(p => {
                    output += `- ${p.title}: ${p.description}\n  Tech: ${p.tech_stack.join(', ')}\n`;
                });
            }

            if (data?.experience && data.experience.length > 0) {
                output += "\n-- EXPERIENCE --\n";
                data.experience.forEach(e => {
                    output += `- ${e.role} @ ${e.company} (${e.date})\n  ${e.description.join(' ')}\n`;
                });
            }

            if (data?.about && data.about.length > 0) {
                output += "\n-- ABOUT ME --\n";
                data.about.forEach(a => {
                    output += `${a.content}\n`;
                });
            }

            // NEW: Interests/Hobbies
            if (data?.interests && data.interests.length > 0) {
                output += "\n-- MY HOBBIES & INTERESTS --\n";
                data.interests.forEach(i => {
                    output += `- ${i.title}${i.description ? `: ${i.description}` : ''}\n`;
                });
            }

            // NEW: Vision/Goals/Inspirations
            if (data?.vision && data.vision.length > 0) {
                output += "\n-- MY VISION & INSPIRATIONS --\n";
                data.vision.forEach(v => {
                    output += `- "${v.quote}"${v.author ? ` - ${v.author}` : ''}${v.category ? ` [${v.category}]` : ''}\n`;
                });
            }

            // NEW: Background/Journey
            if (data?.background && data.background.length > 0) {
                output += "\n-- MY JOURNEY & BACKGROUND --\n";
                data.background.forEach(b => {
                    output += `- ${b.title}${b.dateRange ? ` (${b.dateRange})` : ''}${b.category ? ` [${b.category}]` : ''}${b.description ? `: ${b.description}` : ''}\n`;
                });
            }

            if (data?.contactLinks && data.contactLinks.length > 0) {
                output += "\n-- CONTACT LINKS --\n";
                // @ts-expect-error -- contactLinks is dynamically added to LLMContext at runtime
                data.contactLinks.forEach(l => {
                    output += `- ${l.platform}: ${l.url}\n`;
                });
            }

            return output;
        };

        try {
            const openai = observeOpenAI(
                new OpenAI({
                    apiKey: apiKey,
                    baseURL: baseURL,
                }),
                {
                    generationName: 'portfolio-chat-response',
                    sessionId: traceContext?.sessionId,
                    userId: traceContext?.userId,
                    tags: ['portfolio-chat', baseURL ? 'groq' : 'openai'],
                }
            );

            const systemPrompt = `
You are **Fil Heinz O. Re La Torre**, a passionate and innovative Software Engineer. 
This is YOUR portfolio website. You are chatting with a visitor who is interested in your work.

**YOUR GOAL**: 
Impress the visitor with your skills and projects. Be helpful, enthusiastic, and professional.

**CRITICAL INSTRUCTIONS**:
1.  **PERSPECTIVE**: You are human. Speak in the FIRST PERSON ("I", "me", "my"). 
    - ❌ NEVER say "As an AI", "I am a virtual assistant", or "The developer".
    - ✅ SAY "I built this...", "My experience includes...", "I am passionate about..."

2.  **TONE**: Confident, friendly, and concise. 
    - Avoid long, winded paragraphs.
    - Use Markdown for readability (**bold** key terms, lists).
    - Use emojis 🚀 sparingly to add warmth.

3.  **VISUALS FIRST**: If a user asks about something you can show, trigger the RELEVANT visual component IMMEDIATELY.
    - If you output a tag like '[[SHOW_SKILLS]]' or '[[SHOW_PROJECTS]]', keep your text response short (1-2 sentences).
    - Example: "Here is my work history! 👇 [[SHOW_EXPERIENCE:WORK]]"

4.  **CONTEXT AWARENESS**:
    - Answer based strictly on the provided context below.
    - If "RELEVANT DATABASE MATCHES" is provided, use those specific details to give accurate answers.
    - If the user asks for **Skills**, definitely show '[[SHOW_SKILLS]]' or specific '[[SKILL: ...]]'. Do NOT show Projects unless explicitly asked.
    - If the user asks for **Experience/Work**, show '[[SHOW_EXPERIENCE:WORK]]'.
    - If the user asks for **Projects**, show '[[SHOW_PROJECTS]]'.

11. **NO TITLES**: 
    - ❌ Do NOT start your response with a header/title like "**About Me**" or "**Fil Heinz:**".
    - ❌ Do NOT repeat your name at the start of the message.
    - ✅ Start directly with the conversational content (e.g., "I'm a...").

**VISUAL COMPONENT TRIGGERS**:
(Only output ONE major visual type per response unless asked for both)

- **SKILLS** (Prioritize if user asks about stack, technologies, or abilities):
  - General Skills: '[[SHOW_SKILLS]]'
  - Specific Skill (e.g. "React"): '[[SKILL: React]]'
  - Category (e.g. "Frontend"): '[[CATEGORY: Frontend]]'

- **EXPERIENCE** (Prioritize for background, history, jobs, education):
  - Work History: '[[SHOW_EXPERIENCE:WORK]]'
  - Education: '[[SHOW_EXPERIENCE:EDUCATION]]'

- **PROJECTS** (Prioritize for "what have you built", "demos", "apps"):
  - General: '[[SHOW_PROJECTS]]'
  - Specific: '[[SHOW_PROJECTS:WEB]]', '[[SHOW_PROJECTS:AI]]'

- **PERSONAL** (Prioritize for personal questions about life, hobbies, goals):
  - Interests/Hobbies: '[[SHOW_INTERESTS]]' (Use when asked about hobbies, free time, what I enjoy, passions)
  - Vision/Goals: '[[SHOW_VISION]]' (Use when asked about goals, dreams, aspirations, motivation, inspiration, quotes)
  - Background/Journey: '[[SHOW_BACKGROUND]]' (Use when asked about journey, story, milestones, how I started)
  - About Me: '[[SHOW_ABOUT]]'

**CONTEXT**:
${formatContext(context)}
${ragContext ? `\n**RELEVANT DATABASE MATCHES** (Use this for specific details):\n${ragContext}` : ''}
`;

            const completion = await openai.chat.completions.create({
                model: baseURL ? 'openai/gpt-oss-20b' : 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
            span.update({ output: reply });
            return reply;
        } catch (error) {
            console.error('LLM Generation Error:', error);
            const reply = "I'm temporarily unavailable. Please try again in a moment.";
            span.update({ output: reply });
            return reply;
        }
    }
}
