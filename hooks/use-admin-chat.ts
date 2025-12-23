"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase-client"

export interface Conversation {
    id: string
    created_at: string
    updated_at: string
    messages: Message[]
    user_id?: string
    assigned_admin_id?: string
    last_seen_at?: string
}

export interface Message {
    id: string
    content: string
    sender_type: 'user' | 'bot' | 'admin'
    created_at: string
}

export function useAdminChat() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

    // Process and sort conversations
    // Memoized to prevent unnecessary recalculations if called internally
    const processConversations = useCallback((raw: any[]): Conversation[] => {
        return raw.map(c => ({
            ...c,
            // Ensure messages are sorted chronologically
            messages: Array.isArray(c.messages)
                ? c.messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                : []
        })).sort((a, b) => {
            // Sort conversations by most recent activity (message or creation)
            const lastMsgA = a.messages[a.messages.length - 1]
            const lastMsgB = b.messages[b.messages.length - 1]
            const timeA = lastMsgA ? new Date(lastMsgA.created_at).getTime() : new Date(a.created_at).getTime()
            const timeB = lastMsgB ? new Date(lastMsgB.created_at).getTime() : new Date(b.created_at).getTime()
            return timeB - timeA
        })
    }, [])

    const fetchConversations = useCallback(async (showLoading = false) => {
        if (showLoading) setIsLoading(true)

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                messages (
                    id, content, sender_type, created_at
                )
            `)
            .order('updated_at', { ascending: false })
            .limit(50)

        if (data) {
            const processed = processConversations(data)
            setConversations(processed)
        }

        if (showLoading) setIsLoading(false)
        setIsInitialLoad(false)
    }, [processConversations])

    useEffect(() => {
        // Initial Fetch
        fetchConversations(true)

        // Presence Subscription (Global Room)
        // Reverting to the logic that was verified as working in commit 4d86c940
        // Presence Subscription (Global Room)
        // Aggressive Full Sync Strategy: On ANY event, recalc from scratch.
        const presenceChannel = supabase.channel('room:chat-presence')

        const updateOnlineUsers = () => {
            const newState = presenceChannel.presenceState()
            const onlineIds = new Set<string>()

            // Robust check: Look at both keys AND payloads
            Object.entries(newState).forEach(([key, presences]) => {
                // 1. If the key itself looks like a conversation ID (UUID)
                if (key && key.length > 20) {
                    onlineIds.add(key)
                }

                // 2. Deep scan of payloads (in case key is random)
                if (Array.isArray(presences)) {
                    presences.forEach((p: any) => {
                        if (p.conversationId) {
                            onlineIds.add(p.conversationId)
                        }
                    })
                }
            })

            // console.log("Admin: Computed Online IDs", Array.from(onlineIds))
            setOnlineUsers(onlineIds)
        }

        presenceChannel
            .on('presence', { event: 'sync' }, updateOnlineUsers)
            .on('presence', { event: 'join' }, updateOnlineUsers)
            .on('presence', { event: 'leave' }, updateOnlineUsers)
            .subscribe()

        // Real-time Subscription for DB changes
        const dbChannel = supabase
            .channel('admin-chat-manager')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    // When a new message arrives, we DO need to refetch to get the full conversation structure
                    fetchConversations(false)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations'
                },
                (payload) => {
                    // SEAMLESS UPDATE: Do NOT refetch.
                    const updatedConv = payload.new as Conversation

                    setConversations(prev => {
                        return prev.map(c =>
                            c.id === updatedConv.id ? { ...c, ...updatedConv } : c
                        )
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(presenceChannel)
            supabase.removeChannel(dbChannel)
        }
    }, [fetchConversations])

    return {
        conversations,
        onlineUsers,
        isLoading: isInitialLoad ? isLoading : false,
        refresh: () => fetchConversations(true)
    }
}
