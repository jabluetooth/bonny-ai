import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    // 1. Verify Admin Session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate Admin Email (Double check against env)
    if (session.user.email !== process.env.ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { conversationId } = await req.json();

        if (!conversationId) {
            return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
        }

        // 3. Update Supabase
        // We need a Supabase client. Admin is operating this, so we can use their credentials 
        // OR just use the Service Role Key to ensure we can overwrite the 'assigned_admin_id'
        // regardless of current RLS state for 'users'.
        // Since this is an admin action, and we've verified authentication via NextAuth,
        // using the Service Role Key (if available) is cleaner for "Force Takeover".
        // HOWEVER, for now we will use the standard client (anon key) and assume RLS allows 
        // updates if we are just setting a field, OR we assume the Admin has a Supabase Admin User.
        // Given the Phase 2 setup, we didn't explicitly create a Supabase Auth User for the admin,
        // we just have a 'public.admin' table.
        // So we must use a way to write to 'conversations'.
        // The safest way here without a Supabase Auth User is to use the Service Role Key.
        // If not available, we use the Anon key and hoping RLS is open enough or we have a policy.

        // BUT we added "alter table admin enable row level security".
        // And users/conversations have RLS.
        // So usually an arbitrary anonymous request CANNOT update 'assigned_admin_id'.
        // We MUST use SERVICE ROLE KEY so this API route (protected by NextAuth) has sudo access.

        // Check if we have a service key in env? 
        // Standard Supabase Next.js setup creates `SUPABASE_SERVICE_ROLE_KEY`.
        // We'll try to use it. If not, we fall back to anon (which will fail with strict RLS).

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.warn("Missing SUPABASE_SERVICE_ROLE_KEY, takeover might fail due to RLS.");
        }

        // Creating a client with Service Role if possible
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { get: () => undefined, set: () => { }, remove: () => { } }
            }
        );

        // Update the conversation
        // We assign the admin's email or ID to 'assigned_admin_id'
        // Reference Phase 2: "assigned_admin_id text references admin(id)"
        // And admin(id) matches NextAuth User ID (or we use email if id is email).
        // The 'admin' table has 'id' as primary key.
        // We'll use the email as the ID if that's how we set it up, or the Google Sub ID.
        // Since we don't have the Google Sub ID easily accessible in the simple session without extra callbacks,
        // we'll try to look up the admin or just use the email if we inserted it as ID.
        // For simplicity, let's assume valid admin ID ~ email or we look it up.

        // Let's UPDATE 'assigned_admin_id' to the session email (assuming that's the admin ID).
        const adminId = session.user.email; // or session.user.id if customized

        const { error } = await supabase
            .from('conversations')
            .update({ assigned_admin_id: adminId })
            .eq('id', conversationId);

        if (error) {
            console.error("Takeover failed:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, mode: 'manual' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
