"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Pill, PillIcon } from '@/components/ui/shadcn-io/pill'
import { UsersIcon } from 'lucide-react'

export function VisitorCounter({ initialCount }: { initialCount: number }) {
    const [count, setCount] = useState(initialCount)
    const supabase = createClient()

    useEffect(() => {
        // Update local count if initial changes
        setTimeout(() => setCount(initialCount), 0)

        // Subscribe to INSERT/DELETE events on 'users' table
        // Note: usage of this subscription depends on RLS policies allowing the user to see these events.
        const channel = supabase
            .channel('realtime-users-count')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setCount((prev) => prev + 1)
                    } else if (payload.eventType === 'DELETE') {
                        setCount((prev) => Math.max(0, prev - 1))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [initialCount, supabase])

    return (
        <Pill className="h-7 text-xs">
            <PillIcon icon={UsersIcon} />
            <span className="p-1">{count} users</span>
        </Pill>
    )
}
