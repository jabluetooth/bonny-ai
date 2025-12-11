import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateLLMResponse } from '@/lib/llm';
import { z } from 'zod';
import xss from 'xss';

// Schema for request validation
const sendSchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(2000), // Reasonable limit
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
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
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

        const { conversationId, content: rawContent } = result.data;

        // 3. Sanitize Content (XSS Protection)
        // We use 'xss' library to strip dangerous tags/attributes
        const content = xss(rawContent);

        console.log(`[Send Route] User: ${user.id}, Conversation: ${conversationId}`);

        // 4. Save User Message
        // RLS policies should handle this on insert/select
        const { error: msgError } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: 'user',
            content,
        });

        if (msgError) {
            console.error('Error saving user message:', msgError);
            return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
        }

        // REMOVED: Admin Check (Admin takeover logic removed per requirements)

        // 5. Gather Context for AI
        const [
            { data: projects },
            { data: skills },
            { data: experience },
            { data: about },
            { data: userProfile }
        ] = await Promise.all([
            supabase.from('projects').select('*'),
            supabase.from('skills').select('*, category:skill_categories(title)'),
            supabase.from('experience').select('*'),
            supabase.from('about').select('*'),
            supabase.from('users').select('name').eq('id', user.id).single(),
        ]);

        // Helper to reduce token usage by stripping metadata
        const minifyData = (items: any[], fields: string[]) => {
            return items?.map(item => {
                const mini: any = {};
                fields.forEach(f => {
                    if (item[f]) mini[f] = item[f];
                });
                // Special case for nested category in skills
                if (item.category?.title) mini.category = item.category.title;
                return mini;
            }) || [];
        };

        const context = {
            userName: userProfile?.name || "Guest",
            // Selectively keep fields to save tokens. 
            // Fallback: If 'title'/'name' missing, it might be the other. Included common variations.
            projects: minifyData(projects || [], ['title', 'name', 'description', 'technologies', 'tech_stack', 'link', 'url']),
            skills: minifyData(skills || [], ['name', 'description']),
            experience: minifyData(experience || [], ['company', 'role', 'position', 'period', 'duration', 'date', 'description']),
            about: minifyData(about || [], ['title', 'bio', 'content', 'description']),
            categories: Array.from(new Set(skills?.map((s: any) => s.category?.title).filter(Boolean))) || [],
        };

        // 6. Generate AI Response
        const aiResponse = await generateLLMResponse(content, context);

        // 7. Save Bot Message
        // We rely on RLS allowing 'bot' messages or user permissions to write to messages.
        const { error: botMsgError } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: 'bot',
            content: aiResponse,
        });

        if (botMsgError) {
            console.error('Error saving bot message:', botMsgError);
            // Log but still return response so UI updates
        }

        return NextResponse.json({ reply: aiResponse });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
