import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Lazy initialization to prevent build-time errors
let resend: Resend | null = null;
function getResend() {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

const sendEmailSchema = z.object({
    email: z.string().email(),
    message: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

export async function POST(request: Request) {
    const cookieStore = await cookies();

    // 1. Initialize Supabase for Auth Check
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

    // 2. Authenticate User (Must have session, even anonymous)
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: 'Unauthorized. Please start a conversation first.' },
            { status: 401 }
        );
    }

    try {
        // 3. Input Validation
        const body = await request.json();
        const result = sendEmailSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.errors },
                { status: 400 }
            );
        }

        const { email, message } = result.data;

        // 4. Origin Check (Security Best Practice)
        const origin = request.headers.get('origin');
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;
            if (!allowedOrigin || !origin || !origin.startsWith(allowedOrigin)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        if (!process.env.MY_EMAIL) {
            console.error('[send] MY_EMAIL env var is not set');
            return NextResponse.json({ error: 'Contact form is not configured' }, { status: 503 });
        }

        const { data, error } = await getResend().emails.send({
            from: 'Portfolio Contact <onboarding@resend.dev>',
            to: [process.env.MY_EMAIL!],
            subject: `New Message from Portfolio Visitor (${email})`,
            replyTo: email,
            text: message,
        });

        if (error) {
            console.error('[send] Resend error:', error);
            return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[send] Unexpected error:', error);
        return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
    }
}
