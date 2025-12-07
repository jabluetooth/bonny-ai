import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { conversationId } = await req.json();

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { get: () => undefined, set: () => { }, remove: () => { } }
            }
        );

        // Set assigned_admin_id to NULL to release control back to AI
        const { error } = await supabase
            .from('conversations')
            .update({ assigned_admin_id: null })
            .eq('id', conversationId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, mode: 'ai' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
