import { createBrowserClient } from '@supabase/ssr';

// Singleton instance for browser-side usage
export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookieOptions: {
            // Force session cookie (expire on browser close)
            maxAge: null,
            expires: null
        } as any
    }
);

// Factory function (Legacy support, but prefer singleton for Realtime)
export function createClient() {
    return supabase;
}
