import OpenAI from 'openai';

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
    title: string;
    content: string;
}

export interface LLMContext {
    userName?: string;
    projects?: ProjectContext[];
    skills?: SkillContext[];
    experience?: ExperienceContext[];
    about?: ProfileContext[];
    categories?: string[];
    [key: string]: any; // Allow extensibility
}

export async function generateLLMResponse(
    userMessage: string,
    context: LLMContext
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined;

    if (!apiKey) {
        console.error('LLM Config Error: No API Key found (GROQ_API_KEY or OPENAI_API_KEY)');
        return "I'm currently unable to process requests due to a configuration error (Missing API Key).";
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
                output += `**${a.title}**: ${a.content}\n`;
            });
        }

        return output;
    };

    try {
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL,
        });

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

3.  **VISUALS FIRST**: If a user asks about something you can show, trigger the visual component IMMEDIATELY.
    - If you output a tag like '[[SHOW_PROJECTS]]', keep your text response short (1-2 sentences) introducing the visual.
    - Example: "Here are some of the projects I've worked on! 👇 [[SHOW_PROJECTS]]"

4.  **CONTEXT AWARENESS**: 
    - Answer based strictly on the provided context below.
    - If the user's name is known (and not "Guest"), use it occasionally.

**VISUAL COMPONENT TRIGGERS**:
(Include these tags in your response to show interactive cards)

- **PROJECTS**:
  - General Work/Portfolio: '[[SHOW_PROJECTS]]'
  - Web/Full Stack/Frontend: '[[SHOW_PROJECTS:WEB]]'
  - AI/ML/Data: '[[SHOW_PROJECTS:AI]]'

- **SKILLS**:
  - General Skills: '[[SHOW_SKILLS]]'
  - Specific Skill (e.g. "React"): '[[SKILL: React]]' (Exact name from context)
  - Category (e.g. "Frontend"): '[[CATEGORY: Frontend]]'

- **EXPERIENCE / BACKGROUND**:
  - Work History/Jobs: '[[SHOW_EXPERIENCE:WORK]]'
  - Education/Degrees: '[[SHOW_EXPERIENCE:EDUCATION]]'
  - General Background: '[[SHOW_EXPERIENCE:WORK]]'

- **PERSONAL**:
  - Interests/Hobbies: '[[SHOW_INTERESTS]]'
  - Vision/Goals: '[[SHOW_VISION]]'
  - About Me: '[[SHOW_ABOUT]]'

**CONTEXT**:
${formatContext(context)}
`;

        const completion = await openai.chat.completions.create({
            model: baseURL ? 'llama-3.1-8b-instant' : 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
        console.error('LLM Generation Error:', error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return `I'm experiencing technical difficulties (Error: ${errorMessage}).`;
    }
}
