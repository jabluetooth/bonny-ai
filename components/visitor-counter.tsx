"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Pill, PillIcon } from '@/components/ui/shadcn-io/pill'
import { UsersIcon } from 'lucide-react'

export function VisitorCounter({ initialCount }: { initialCount: number }) {
    const [count, setCount] = useState(initialCount)
    const [supabase] = useState(() => createClient())

    useEffect(() => {
        const channel = supabase.channel('online-visitors')
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                // Count unique presence IDs
                const presentUsers = Object.keys(state).length
                setCount(presentUsers)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track our own presence
                    await channel.track({ online_at: new Date().toISOString() })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return (
        <Pill className="h-7 text-xs">
            <PillIcon icon={UsersIcon} />
            {/* Fixed width so the pill doesn't jump when the count arrives. */}
            <span className="p-1 inline-block min-w-[4.5rem] tabular-nums">
                {count === 0 ? "– online" : `${count} online`}
            </span>
        </Pill>
    )
}
