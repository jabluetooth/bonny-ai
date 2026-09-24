import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { allowRequest, RATE_LIMITS } from '@/lib/rate-limit';

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
    email: z.string().trim().email('Enter a valid email address.'),
    message: z.string().trim().min(1, 'Write a message first.').max(5000, 'Keep the message under 5,000 characters.'),
    // Honeypot: a field real visitors never see. Bots that fill every input do.
    website: z.string().optional(),
});

/**
 * The site's own origins. www and apex are both accepted so the form works
 * whichever one a visitor lands on. Compared exactly, never by prefix.
 */
function allowedOrigins(): Set<string> {
    const origins = new Set<string>();
    const base = process.env.NEXT_PUBLIC_APP_URL;
    if (base) {
        try {
            const url = new URL(base);
            origins.add(url.origin);
            const host = url.hostname.startsWith('www.') ? url.hostname.slice(4) : `www.${url.hostname}`;
            origins.add(`${url.protocol}//${host}`);
        } catch { /* misconfigured URL: fall through with an empty set */ }
    }
    return origins;
}

// Anyone can reach the contact form (no chat session needed), so it is
// protected by an exact origin check, a honeypot and a per-IP rate limit.
export async function POST(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        const origin = request.headers.get('origin');
        if (!origin || !allowedOrigins().has(origin)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const result = sendEmailSchema.safeParse(body);
    if (!result.success) {
        const first = result.error.errors[0]?.message ?? 'Check the form and try again.';
        return NextResponse.json({ error: first }, { status: 400 });
    }

    const { email, message, website } = result.data;

    // Pretend success so bots don't learn to skip the field.
    if (website) return NextResponse.json({ success: true });

    if (!(await allowRequest(request, RATE_LIMITS.contact))) {
        return NextResponse.json(
            { error: "You've sent a few messages already. Try again in an hour, or email me directly." },
            { status: 429 }
        );
    }

    if (!process.env.MY_EMAIL) {
        console.error('[send] MY_EMAIL env var is not set');
        return NextResponse.json({ error: 'The contact form isn’t set up yet. Please email me directly.' }, { status: 503 });
    }

    try {
        const { error } = await getResend().emails.send({
            // Set CONTACT_FROM_EMAIL to an address on a domain verified in
            // Resend for better deliverability; the sandbox sender works but
            // only delivers to the Resend account owner.
            from: process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
            to: [process.env.MY_EMAIL],
            subject: `New message from ${email}`,
            replyTo: email,
            text: message,
        });

        if (error) {
            console.error('[send] Resend error:', error);
            return NextResponse.json({ error: 'The message couldn’t be sent. Please try again in a minute.' }, { status: 502 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[send] Unexpected error:', error);
        return NextResponse.json({ error: 'The message couldn’t be sent. Please try again in a minute.' }, { status: 500 });
    }
}
