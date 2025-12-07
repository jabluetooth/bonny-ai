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
- Only answer based on the provided context.
- If you don't know the answer, say "I don't have that information in my current context."
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
