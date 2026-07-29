import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client using the service-role key — bypasses RLS.
 * Never import this from a "use client" component; SUPABASE_SERVICE_ROLE_KEY
 * has no NEXT_PUBLIC_ prefix so it won't be inlined into client bundles, and
 * accessing it there will just throw the error below instead of leaking.
 */
export function createAdminClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRoleKey) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
            'createAdminClient() must only be called from server-side code with the service role key configured.'
        )
    }

    return createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}
