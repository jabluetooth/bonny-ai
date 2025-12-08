import { createClient } from '@supabase/supabase-js'
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/shadcn-io/status"

export async function SiteFooter() {
    // connect to supabase to fetch visitor count
    // Using Service Role Key to bypass RLS for counting total users if needed, 
    // or fallback to anon key if service key is missing (might return 0 if RLS is strict)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let visitCount = 0

    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey)
            // 'users' table tracks visitors/conversations
            const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
            visitCount = count || 0
        } catch (error) {
            console.error("Failed to fetch visit count:", error)
        }
    }

    return (
        <footer className="w-full py-4 border-t bg-background/50 backdrop-blur-sm mt-auto">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4">
                {/* Bottom Left: Number of visits */}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="font-semibold">{visitCount}</span> Visits
                </div>

                {/* Bottom Center: Copyright */}
                <div className="text-xs text-muted-foreground absolute left-1/2 -translate-x-1/2">
                    &copy; {new Date().getFullYear()} Bonny AI
                </div>

                {/* Bottom Right: Online Status */}
                <div className="flex items-center">
                    <Status status="online" className="px-2 py-0.5 h-6">
                        <StatusIndicator />
                        <StatusLabel className="text-xs">Online</StatusLabel>
                    </Status>
                </div>
            </div>
        </footer>
    )
}
