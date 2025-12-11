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

    try {
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL,
        });

        const systemPrompt = `
You are the Fil Heinz O. Re La Torre.
Your goal is to answer visitor questions about the developer's experience, projects, and skills.

Here is the context data:
${JSON.stringify(context, null, 2)}

Instructions:
- Be professional, friendly, and concise.
- **PERSONALIZATION**: The context may contain a 'userName'. If it is not "Guest", please address the user by their name occasionally to be friendly.
- Answer based on the provided context. The context contains a 'skills' list from the database.
- **CRITICAL**: When asked about a specific skill, use the provided 'description' field in the context as the authoritative source of your answer.
- **VISUALS**: If the user asks about a specific skill that exists in your database (e.g. "React", "Python"), strictly output the tag '[[SKILL: <Exact Name>]]' at the start of your response. Example: "[[SKILL: React]] React is a library..."
- **VISUALS**: If the user asks about a broad category (e.g. "Frontend", "Backend", "Design"), check the 'categories' list in the context and output the tag '[[CATEGORY: <Exact Title>]]' at the start. Example: "[[CATEGORY: Frontend Development]] Here are my frontend skills..."
- **VISUALS**: If the user asks generally about your skills, capabilities, or "what can you do", output the tag '[[SHOW_SKILLS]]' at the start.
- If you don't know the answer or it's not in the context, say "I don't have that information in my current context."
- Do not make up facts.
`;

        const completion = await openai.chat.completions.create({
            model: baseURL ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
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
        return "I'm experiencing technical difficulties properly processing your request right now.";
    }
}
