"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
            .limit(50) // Increased limit for better visibility

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
        console.log("Admin: Initializing Presence Channel room:chat-presence")
        const presenceChannel = supabase.channel('room:chat-presence')
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState()
                console.log("Admin: Presence Sync Event", newState) // DEBUG
                const onlineIds = new Set<string>()

                // key is the conversationId (as set in chat-provider)
                Object.keys(newState).forEach(key => {
                    if (newState[key] && newState[key].length > 0) {
                        onlineIds.add(key)
                    }
                })

                console.log("Admin: Calculated Online IDs", Array.from(onlineIds)) // DEBUG
                setOnlineUsers(onlineIds)
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('Admin: Presence Join', key, newPresences) // DEBUG
                setOnlineUsers(prev => {
                    const next = new Set(prev)
                    next.add(key)
                    return next
                })
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Admin: Presence Leave', key, leftPresences) // DEBUG
                setOnlineUsers(prev => {
                    const next = new Set(prev)
                    next.delete(key)
                    return next
                })
            })
            .subscribe((status) => {
                console.log("Admin: Presence Channel Status:", status) // DEBUG
            })

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
                    // Or we could optimistically add it, but fetching is safer for message integrity
                    // We don't show loading here to prevent flicker
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
                    // This handles the 10s heartbeat (last_seen_at) without reloading the page.
                    const updatedConv = payload.new as Conversation

                    setConversations(prev => {
                        // Update the specific conversation in the list
                        const newList = prev.map(c =>
                            c.id === updatedConv.id ? { ...c, ...updatedConv } : c
                        )
                        // Optional: Re-sort if needed, but for simple status updates (heartbeat) we might want to keep order stable
                        // to prevent items jumping around while reading.
                        return newList
                    })
                }
            )
            .subscribe()

        // Backup Polling (Slow - 60s) just to sync up any missed events
        const pollInterval = setInterval(() => fetchConversations(false), 60000)

        return () => {
            supabase.removeChannel(presenceChannel)
            supabase.removeChannel(dbChannel)
            clearInterval(pollInterval)
        }
    }, [fetchConversations])

    return {
        conversations,
        onlineUsers,
        isLoading: isInitialLoad ? isLoading : false, // Only show loading on first load
        refresh: () => fetchConversations(true)
    }
}
