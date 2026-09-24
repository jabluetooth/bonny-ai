import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Read-only access to public portfolio content with the anon key and no
 * cookies. Unlike lib/supabase-server.ts it doesn't read the request, so
 * pages and route handlers that use it can be statically rendered and
 * cached (with `export const revalidate`) instead of rendering on every
 * request. Use it only for data every visitor may see.
 */
export function createPublicClient(): SupabaseClient {
    if (!client) {
        client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
    }
    return client
}
