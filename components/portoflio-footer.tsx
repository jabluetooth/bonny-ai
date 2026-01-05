import { createClient } from '@supabase/supabase-js'
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/shadcn-io/status"
import { Pill, PillIcon } from '@/components/ui/shadcn-io/pill';
import { UsersIcon } from 'lucide-react';
import { VisitorCounter } from './visitor-counter';

export async function SiteFooter() {


    return (
        <footer className="w-full py-4 bg-background/50 backdrop-blur-sm mt-auto">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4">
                {/* Bottom Left: Number of visits */}
                <div>
                    <VisitorCounter initialCount={0} />
                </div>

                {/* Bottom Center: Copyright */}
                <div className="text-xs text-muted-foreground md:absolute md:left-1/2 md:-translate-x-1/2">
                    &copy; {new Date().getFullYear()} <b>Bonny AI</b>
                </div>

                {/* Bottom Right: Online Status */}
                <div className="hidden md:flex items-center">
                    <Status status="online" className="px-2 py-0.5 h-6">
                        <StatusIndicator />
                        <StatusLabel className="text-xs">Open for part time</StatusLabel>
                    </Status>
                </div>
            </div>
        </footer>
    )
}
