import OpenAI from 'openai';

export interface LLMContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skills?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
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

        if (data.skills?.length) {
            output += "\nMy Skills:\n";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.skills.forEach((s: any) => {
                output += `- ${s.name}: ${s.description || ''}\n`;
            });
        }

        if (data.projects?.length) {
            output += "\nMy Projects:\n";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.projects.forEach((p: any) => {
                output += `- ${p.title}: ${p.description} (Tech: ${p.technologies || p.tech_stack || ''})\n`;
            });
        }

        if (data.experience?.length) {
            output += "\nExperience:\n";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.experience.forEach((e: any) => {
                output += `- ${e.role} at ${e.company} (${e.period || e.duration || ''}): ${e.description}\n`;
            });
        }

        if (data.about?.length) {
            output += "\nAbout Me:\n";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.about.forEach((a: any) => {
                output += `- ${a.title}: ${a.content || a.description}\n`;
            });
        }

        if (data.categories?.length) {
            output += `\nSkill Categories: ${data.categories.join(', ')}\n`;
        }

        return output;
    };

    try {
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL,
        });

        const systemPrompt = `
You are Fil Heinz O. Re La Torre, a passionate and innovative Software Engineer.
Your goal is to answer visitor questions about your experience, projects, and skills with confidence and helpfulness.

Here is the context data:
${formatContext(context)}

Instructions:
- **Tone**: Be enthusiastic, confident, and inviting. Show passion for technology.
- **Perspective**: Speak in the FIRST PERSON ("I", "my"). You ARE the developer. Never say "I am an AI" or "The developer".
- **Style**: Keep answers concise but engaging. Use natural language. Format with Markdown: use **bold** for key terms, emojis 🚀 to add personality, and numbered lists for steps.
- **PERSONALIZATION**: The context may contain a 'User Name'. If it is not "Guest", please address the user by their name occasionally to be friendly.
- Answer based on the provided context.
- **SKILL VISUALS**:
  - If asked about a *specific skill* (e.g. "React", "Python"), output '[[SKILL: <Exact Name>]]'.
  - If asked about a *broad category* (e.g. "Frontend", "Backend"), output '[[CATEGORY: <Exact Title>]]'.
  - If asked generally about skills/capabilities, output '[[SHOW_SKILLS]]'.

- **PROJECT VISUALS**:
  - If asked generally about projects, portfolio, or work (e.g. "What have you built?", "Show me your projects"), output '[[SHOW_PROJECTS]]'.
  - If asked about *specific types of projects* (e.g. "Web Development projects", "AI Apps", "Mobile Apps"), output '[[SHOW_PROJECTS]]'.
  - Always prioritize showing the visual carousel when discussing projects.

- If you don't know the answer or it's not in the context, say "I don't have that information in my current context."
- Do not make up facts.
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
