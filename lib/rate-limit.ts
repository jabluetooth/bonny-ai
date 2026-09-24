import { createAdminClient } from './supabase-admin'

/**
 * Per-IP rate limiting for routes that cost money or send email.
 *
 * Primary store: the `rate_limit_hit()` Postgres function from
 * supabase/sql/security-hardening.sql, called with the service-role client.
 * It counts hits atomically across every serverless instance.
 *
 * Fallback: an in-memory sliding window, used when the function hasn't been
 * created yet or the service-role key isn't configured. It only sees the
 * requests that land on one instance, so it's weaker, but it means the
 * limit works from the first deploy instead of failing open or closed.
 */

export interface RateLimitRule {
    /** Short name, e.g. "chat" or "contact". Part of the stored key. */
    bucket: string
    max: number
    windowSeconds: number
}

export const RATE_LIMITS = {
    chat: { bucket: 'chat', max: 20, windowSeconds: 10 * 60 },
    chatStart: { bucket: 'chat-start', max: 10, windowSeconds: 60 * 60 },
    contact: { bucket: 'contact', max: 3, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>

const memory = new Map<string, number[]>()
let dbUnavailable = false

export function clientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return req.headers.get('x-real-ip') ?? 'unknown'
}

function memoryHit(key: string, rule: RateLimitRule): boolean {
    const now = Date.now()
    const since = now - rule.windowSeconds * 1000
    const hits = (memory.get(key) ?? []).filter((t) => t > since)
    if (hits.length >= rule.max) {
        memory.set(key, hits)
        return false
    }
    hits.push(now)
    memory.set(key, hits)
    // Keep the map from growing without bound on a long-lived instance.
    if (memory.size > 5000) {
        for (const [k, v] of memory) if (!v.some((t) => t > since)) memory.delete(k)
    }
    return true
}

/** Records one request and returns true if it's within the limit. */
export async function allowRequest(req: Request, rule: RateLimitRule): Promise<boolean> {
    const key = `${rule.bucket}:${clientIp(req)}`

    if (!dbUnavailable && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const { data, error } = await createAdminClient().rpc('rate_limit_hit', {
                p_key: key,
                p_max: rule.max,
                p_window_seconds: rule.windowSeconds,
            })
            if (!error && typeof data === 'boolean') return data
            // PGRST202: function not found. Stop asking until the next cold start.
            if (error?.code === 'PGRST202') dbUnavailable = true
            else if (error) console.error('[rate-limit] rpc error, using memory:', error.message)
        } catch (err) {
            console.error('[rate-limit] rpc failed, using memory:', err)
        }
    }

    return memoryHit(key, rule)
}
