import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const cookieStore = await cookies();

    // Create a Supabase client capable of retrieving the auth session from cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // The `delete` method was called from a Server Component.
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

    // 2. Upsert User into public.users table (Tracking)
    // We use upsert to ensure we don't fail if they already exist
    const { error: userError } = await supabase
        .from('users')
        .upsert({ id: user.id }, { onConflict: 'id' });

    if (userError) {
        console.error('Error creating/updating user:', userError);
        return NextResponse.json({ error: 'Failed to track user' }, { status: 500 });
    }

    // 3. Create a new Conversation
    const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .insert({ user_id: user.id })
        .select('id')
        .single();

    if (convoError) {
        console.error('Error creating conversation:', convoError);
        return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 });
    }

    return NextResponse.json({
        conversationId: convo.id,
        userId: user.id,
    });
}
