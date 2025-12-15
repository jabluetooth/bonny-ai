import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmailSchema = z.object({
    email: z.string().email(),
    message: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

export async function POST(request: Request) {
    try {
        // 1. Input Validation
        const body = await request.json();
        const result = sendEmailSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.errors },
                { status: 400 }
            );
        }

        const { email, message } = result.data;

        // 2. Origin Check (Optional but recommended)
        const origin = request.headers.get('origin');
        // In production, verify 'origin' matches your domain
        // if (process.env.NODE_ENV === 'production' && origin && !origin.includes('your-domain.com')) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        // }

        const { data, error } = await resend.emails.send({
            from: 'Portfolio Contact <onboarding@resend.dev>',
            to: [process.env.MY_EMAIL || 'delivered@resend.dev'],
            subject: `New Message from Portfolio Visitor (${email})`,
            replyTo: email,
            text: message,
        });

        if (error) {
            return NextResponse.json({ error }, { status: 400 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
