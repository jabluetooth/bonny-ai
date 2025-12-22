"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"

export function usePresence() {
    const [onlineUsers, setOnlineUsers] = useState<Map<string, Date>>(new Map())
    const [status, setStatus] = useState<string>("DISCONNECTED")

    // Use singleton directly (no useState needed for client itself)

    useEffect(() => {
        // Dedicated channel for Chat Presence (Isolated from Visitor Counter)
        const channel = supabase.channel('room:chat-presence')

        channel.on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState()
            console.log("Chat Presence Sync:", newState) // DEBUG

            const newUsers = new Map<string, Date>()
            const now = new Date()

            // 1. Check Payload
            Object.values(newState).forEach((presences: any) => {
                presences.forEach((p: any) => {
                    if (p.conversationId) {
                        // Use the online_at from payload if available, else now
                        const time = p.online_at ? new Date(p.online_at) : now
                        newUsers.set(p.conversationId, time)
                    }
                })
            })

            // 2. Check Keys (Fallback)
            Object.keys(newState).forEach(key => {
                if (key.length > 30 && !newUsers.has(key)) {
                    newUsers.set(key, now)
                }
            })
            setOnlineUsers(newUsers)
        })
            .subscribe((state) => {
                setStatus(state)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return { onlineUsers, status }
}

