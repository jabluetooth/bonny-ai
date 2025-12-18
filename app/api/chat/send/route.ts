import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateLLMResponse } from '@/lib/llm';
import { getContextForIntent } from '@/lib/chat-context';
import { z } from 'zod';
import xss from 'xss';

// Schema for request validation
const sendSchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(2000),
    intent: z.string().optional(),
});

export async function POST(req: Request) {
    const cookieStore = cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignored
                    }
                },
            },
        }
    );

    // 1. Authenticate User
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();

        // 2. Validate Input
        const result = sendSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.format() },
                { status: 400 }
            );
        }

        const { conversationId, content: rawContent, intent } = result.data;

        // 3. Sanitize Content (XSS Protection)
        const content = xss(rawContent);

        // CHECK LIMIT: Count user messages
        const { count, error: countError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: false })
            .eq('conversation_id', conversationId)
            .eq('sender_type', 'user');

        if (countError) console.error('Error counting messages:', countError);

        const safeCount = count ?? 0;
        const MESSAGE_LIMIT = 10;

        if (safeCount >= MESSAGE_LIMIT) {
            return NextResponse.json({
                limitReached: true,
                reply: "I'm sorry, you've reached the message limit for this preview. Thank you for chatting!"
            });
        }

        // 4. Save User Message
        const { error: msgError } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: 'user',
            content,
        });

        if (msgError) {
            console.error('Error saving user message:', msgError);
            return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
        }

        // Fetch User Profile for Name
        const { data: userProfile } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();

        // 5. Gather Context for AI based on Intent
        // Logic extracted to lib/chat-context.ts for cleaner code
        const context = await getContextForIntent(supabase, intent, userProfile?.name || "Guest");


        // 6. Generate AI Response
        // TOKEN OPTIMIZATION: Check for Static Response first
        let aiResponse = "";

        // Helper to format static data
        const formatList = (items: any[], key: string, desc: string) =>
            items?.map(i => `**${i[key]}**: ${i[desc] || ''}`).join('\n') || "No information available.";

        // Helper for Variations
        const pickVariation = (variations: string[], name: string = "Guest") => {
            const template = variations[Math.floor(Math.random() * variations.length)];
            const cleanName = name !== "Guest" ? `, ${name}` : "";
            return template.replace("{{name}}", cleanName);
        };

        // Deterministic Responses based on Intent
        if (intent === 'QUERY_PROJECTS') {
            const lowerContent = content.toLowerCase();
            const name = context.userName || "Guest";

            if (lowerContent.includes('web')) {
                const webVars = [
                    "[[SHOW_PROJECTS]] Here are my **Web Development** projects{{name}}! 🌐",
                    "[[SHOW_PROJECTS]] I've built some exciting things for the web. Check them out{{name}} 👇",
                    "[[SHOW_PROJECTS]] Exploring the full stack is my passion. Here are my web projects! 💻"
                ];
                aiResponse = pickVariation(webVars, name);
            } else if (lowerContent.includes('ai') || lowerContent.includes('machine learning')) {
                const aiVars = [
                    "[[SHOW_PROJECTS]] Check out my **AI & Machine Learning** innovations{{name}}! 🤖",
                    "[[SHOW_PROJECTS]] Here's how I'm using AI to solve problems. Take a look{{name}}!",
                    "[[SHOW_PROJECTS]] Diving into the future with AI & ML. Here are my projects 🧠"
                ];
                aiResponse = pickVariation(aiVars, name);
            } else {
                const genVars = [
                    "[[SHOW_PROJECTS]] Check out my projects below{{name}}! 🚀",
                    "[[SHOW_PROJECTS]] Here is a collection of my work. Enjoy{{name}}!",
                    "[[SHOW_PROJECTS]] I'm proud of what I've built. Have a look{{name}} 👇"
                ];
                aiResponse = pickVariation(genVars, name);
            }
        }
        else if (intent === 'QUERY_SKILLS') {
            const lowerContent = content.toLowerCase();
            if (lowerContent.includes('frontend')) aiResponse = "[[CATEGORY: Frontend Development]] Here are my Frontend skills.";
            else if (lowerContent.includes('backend')) aiResponse = "[[CATEGORY: Backend Development]] Here are my Backend skills.";
            else if (lowerContent.includes('design')) aiResponse = "[[CATEGORY: Design]] I love creating beautiful UIs.";
            else aiResponse = "[[SHOW_SKILLS]] Here are my technical skills.";
        }
        else if (intent === 'QUERY_WORK') {
            aiResponse = "[[SHOW_EXPERIENCE:WORK]] Here is my professional work history.";
        }
        else if (intent === 'QUERY_EDUCATION') {
            aiResponse = "[[SHOW_EXPERIENCE:EDUCATION]] Here is my educational background.";
        }
        else if (intent === 'QUERY_EXPERIENCE') {
            aiResponse = "[[SHOW_EXPERIENCE:WORK]] Here is my professional experience.";
        }
        else if (intent === 'QUERY_INTERESTS') {
            aiResponse = "[[SHOW_INTERESTS]] Here are my interests and hobbies! 📸";
        }
        else if (intent === 'QUERY_VISION') {
            aiResponse = "[[SHOW_VISION]] Here is my vision for the future! 🔮";
        }
        else if (intent === 'QUERY_ABOUT_ME') {
            aiResponse = `[[SHOW_ABOUT]] Here is a bit about me:\n\n${formatList(context.about || [], 'title', 'content')}`;
        }

        // If no static response, use LLM
        if (!aiResponse) {
            aiResponse = await generateLLMResponse(content, context);
        }



        // 7. Save Bot Message
        const { error: botMsgError } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: 'bot',
            content: aiResponse,
        });

        if (botMsgError) {
            console.error('Error saving bot message:', botMsgError);
        }

        return NextResponse.json({ reply: aiResponse });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
