import OpenAI from 'openai';

export interface LLMContext {
    projects?: any[];
    skills?: any[];
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
            data.skills.forEach((s: any) => {
                output += `- ${s.name}: ${s.description || ''}\n`;
            });
        }

        if (data.projects?.length) {
            output += "\nMy Projects:\n";
            data.projects.forEach((p: any) => {
                output += `- ${p.title}: ${p.description} (Tech: ${p.technologies || p.tech_stack || ''})\n`;
            });
        }

        if (data.experience?.length) {
            output += "\nExperience:\n";
            data.experience.forEach((e: any) => {
                output += `- ${e.role} at ${e.company} (${e.period || e.duration || ''}): ${e.description}\n`;
            });
        }

        if (data.about?.length) {
            output += "\nAbout Me:\n";
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
You are the Fil Heinz O. Re La Torre.
Your goal is to answer visitor questions about the developer's experience, projects, and skills.

Here is the context data:
${formatContext(context)}

Instructions:
- Be professional, friendly, and concise.
- **PERSONALIZATION**: The context may contain a 'User Name'. If it is not "Guest", please address the user by their name occasionally to be friendly.
- Answer based on the provided context.
- **CRITICAL**: When asked about a specific skill, use the provided skill description as the authoritative source of your answer.
- **VISUALS**: If the user asks about a specific skill that exists in the context (e.g. "React", "Python"), strictly output the tag '[[SKILL: <Exact Name>]]' at the start of your response. Example: "[[SKILL: React]] React is a library..."
- **VISUALS**: If the user asks about a broad category (e.g. "Frontend", "Backend", "Design"), check the 'Skill Categories' list and output the tag '[[CATEGORY: <Exact Title>]]' at the start. Example: "[[CATEGORY: Frontend Development]] Here are my frontend skills..."
- **VISUALS**: If the user asks generally about your skills, capabilities, or "what can you do", output the tag '[[SHOW_SKILLS]]' at the start.
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
    } catch (error: any) {
        console.error('LLM Generation Error:', error);
        return `I'm experiencing technical difficulties (Error: ${error.message}).`;
    }
}
