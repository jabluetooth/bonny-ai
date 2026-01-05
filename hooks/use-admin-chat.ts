"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"

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

interface UseAdminChatOptions {
    onNewMessage?: (msg: Message) => void
}

export function useAdminChat({ onNewMessage }: UseAdminChatOptions = {}) {
    // Isolate Admin connection from main app connection to fix presence conflicts
    const [supabase] = useState(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ))

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
    const [userLocations, setUserLocations] = useState<Map<string, string>>(new Map())

    // Use ref to hold latest callback without breaking effect dependencies
    const onNewMessageRef = useRef(onNewMessage)
    useEffect(() => {
        onNewMessageRef.current = onNewMessage
    }, [onNewMessage])

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

        if (data) {
            const processed = processConversations(data)
            setConversations(processed)
        }

        if (showLoading) setIsLoading(false)
        setIsInitialLoad(false)
    }, [processConversations, supabase])

    useEffect(() => {
        // Initial Fetch
        fetchConversations(true)

        // Presence Subscription (Global Room)
        const presenceChannel = supabase.channel('room:chat-presence')

        const updateOnlineUsers = () => {
            const newState = presenceChannel.presenceState()
            const onlineIds = new Set<string>()
            const locations = new Map<string, string>()

            Object.entries(newState).forEach(([key, presences]) => {
                if (key && key.length > 20) {
                    onlineIds.add(key)
                }
                if (Array.isArray(presences)) {
                    presences.forEach((p: any) => {
                        if (p.conversationId) {
                            onlineIds.add(p.conversationId)
                            if (p.location) {
                                locations.set(p.conversationId, p.location)
                            }
                        }
                    })
                }
            })

            setOnlineUsers(onlineIds)
            setUserLocations(locations)
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
                    console.log("[useAdminChat] Supabase INSERT event received:", payload.new) // Debug log

                    // Trigger callback via ref to ensure latest state is used
                    if (onNewMessageRef.current) {
                        onNewMessageRef.current(payload.new as Message)
                    }

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
    }, [fetchConversations, supabase])

    return {
        conversations,
        onlineUsers,
        userLocations,
        isLoading: isInitialLoad ? isLoading : false,
        refresh: () => fetchConversations(true)
    }
}
