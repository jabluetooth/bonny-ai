import { createClient } from './supabase-server'
import type { User } from '@supabase/supabase-js'

/**
 * Server-side admin auth check for API routes, mirroring middleware.ts's
 * guard on /admin/* — a logged-in Supabase user whose email matches
 * MY_EMAIL (fail-closed if MY_EMAIL is unset). Same pattern already used
 * inline in app/api/resume/route.ts and app/api/send/route.ts.
 */
export async function requireAdminUser(): Promise<User | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const allowedEmail = process.env.MY_EMAIL
    if (!user || !allowedEmail || user.email !== allowedEmail) {
        return null
    }

    return user
}
