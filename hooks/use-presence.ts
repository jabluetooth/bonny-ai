"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"

export function usePresence() {
    // We only care about the Set of online conversation IDs
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

    useEffect(() => {
        const channel = supabase.channel('room:chat-presence')

        const updateState = () => {
            const state = channel.presenceState()
            const onlineIds = new Set<string>()

            Object.values(state).forEach((presences: any) => {
                presences.forEach((p: any) => {
                    // Robustly check for conversationId in the payload
                    if (p.conversationId) {
                        onlineIds.add(p.conversationId)
                    }
                })
            })
            // console.log("Presence Update:", Array.from(onlineIds)) // Debug only
            setOnlineUsers(onlineIds)
        }

        channel
            .on('presence', { event: 'sync' }, updateState)
            .on('presence', { event: 'join' }, updateState)
            .on('presence', { event: 'leave' }, updateState)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return { onlineUsers }
}
