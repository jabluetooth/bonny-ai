"use client";

import { supabase } from "@/lib/supabase-client"
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/shadcn-io/status"
import { Pill, PillIcon } from '@/components/ui/shadcn-io/pill';
import { UsersIcon } from 'lucide-react';
import { VisitorCounter } from './visitor-counter';
import { useState, useEffect } from 'react';

export function SiteFooter() {
    const [status, setStatus] = useState<string>("available_fulltime")

    useEffect(() => {
        async function fetchStatus() {
            const { data } = await supabase
                .from('author_profiles')
                .select('status')
                .eq('is_active', true)
                .maybeSingle()

            if (data?.status) {
                setStatus(data.status)
            }
        }
        fetchStatus()
    }, [])

    const getStatusConfig = (s: string) => {
        switch (s) {
            case 'available_fulltime': return { text: "Available for Full-time", color: "bg-emerald-500" }
            case 'available_parttime': return { text: "Open for Part-time", color: "bg-yellow-500" }
            case 'open_for_discussion': return { text: "Open for Discussion", color: "bg-blue-500" }
            case 'busy': return { text: "Busy / Not Looking", color: "bg-red-500" }
            default: return { text: "Available", color: "bg-emerald-500" }
        }
    }

    const config = getStatusConfig(status)

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
                        <span className="relative flex h-2 w-2">
                            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.color}`}></span>
                            <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`}></span>
                        </span>
                        <StatusLabel className="text-xs">{config.text}</StatusLabel>
                    </Status>
                </div>
            </div>
        </footer>
    )
}
