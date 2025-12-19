"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Pill, PillIcon } from '@/components/ui/shadcn-io/pill'
import { UsersIcon } from 'lucide-react'

export function VisitorCounter({ initialCount }: { initialCount: number }) {
    const [count, setCount] = useState(initialCount)

    useEffect(() => {
        // Initial sync
        const fetchCount = async () => {
            try {
                const res = await fetch('/api/stats');
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };

        // Poll every 5 seconds
        const interval = setInterval(fetchCount, 5000);

        // Fetch immediately on mount to sync up
        fetchCount();

        return () => clearInterval(interval);
    }, []);

    return (
        <Pill className="h-7 text-xs">
            <PillIcon icon={UsersIcon} />
            {count === 0 ? (
                <span className="p-1 px-2 text-muted-foreground">...</span>
            ) : (
                <span className="p-1">{count} users</span>
            )}
        </Pill>
    )
}
