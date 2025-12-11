import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const cookieStore = cookies();

    // Create a Supabase client capable of retrieving the auth session from cookies
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

    // 1. Get the authenticated user (Anonymous or Real)
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: 'Unauthorized. Please sign in anonymously first.' },
            { status: 401 }
        );
    }

    const body = await req.text();
    let name: string | undefined;
    try {
        if (body) {
            const json = JSON.parse(body);
            name = json.name;
        }
    } catch (e) { /* ignore invalid json */ }

    // 2. Upsert User into public.users table (Tracking)
    // We use upsert to ensure we don't fail if they already exist
    const { error: userError } = await supabase
        .from('users')
        .upsert({
            id: user.id,
            ...(name ? { name } : {})
        }, { onConflict: 'id' });

    if (userError) {
        console.error('Error creating/updating user:', userError);
    }

    // 3. Search for existing conversation
    const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let conversationId = existingConvo?.id;
    let messages: any[] = [];

    if (conversationId) {
        // Fetch history
        const { data: history } = await supabase
            .from('messages')
            .select('sender_type, content')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (history) {
            messages = history.map(msg => ({
                role: msg.sender_type,
                content: msg.content
            }));
        }
    } else {
        // Create new
        const { data: convo, error: convoError } = await supabase
            .from('conversations')
            .insert({ user_id: user.id })
            .select('id')
            .single();

        if (convoError) {
            console.error('Error creating conversation:', convoError);
            return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 });
        }
        conversationId = convo.id;
    }

    return NextResponse.json({
        conversationId,
        userId: user.id,
        messages // Return history
    });
}
