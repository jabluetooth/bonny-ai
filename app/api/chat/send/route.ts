import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateLLMResponse } from '@/lib/llm';
import { getContextForIntent } from '@/lib/chat-context';
import { getDeterministicResponse } from '@/lib/chat-responses';
import { z } from 'zod';
import xss from 'xss';

// Schema for request validation
const sendSchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(2000),
    intent: z.string().optional(),
});

export async function POST(req: Request) {
    const supabase = createClient();

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
        // TOKEN OPTIMIZATION: Check for Static Response first using Strategy Pattern
        let aiResponse = getDeterministicResponse(intent, content, context);

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
