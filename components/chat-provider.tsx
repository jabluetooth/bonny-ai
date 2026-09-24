"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
import { supabase } from "@/lib/supabase-client"

interface ChatContextType {
    conversationId: string | null
    userId: string | null
    messages: { role: 'user' | 'bot' | 'admin', content: string, component?: ReactNode, id?: string }[]
    sendMessage: (content: string, intent?: string, activeId?: string) => Promise<void>
    addMessage: (message: { role: 'user' | 'bot', content: string, component?: ReactNode }) => void
    isLoading: boolean
    userName: string | null
    setUserName: (name: string) => void
    startChat: (name?: string) => Promise<string | null>
    isChatDisabled: boolean
    isAdminMode: boolean
}

const ChatContext = createContext<ChatContextType>({
    conversationId: null,
    userId: null,
    messages: [],
    sendMessage: async () => { },
    addMessage: () => { },
    isLoading: false,
    userName: null,
    setUserName: () => { },
    startChat: async () => { return null },
    isChatDisabled: false,
    isAdminMode: false
})

export function ChatProvider({ children }: { children: ReactNode }) {
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [messages, setMessages] = useState<{ role: 'user' | 'bot' | 'admin', content: string, component?: ReactNode, id?: string }[]>([])
    // True only while waiting for Bonny's reply (drives the typing indicator).
    // Starting a session is quick and happens behind the first message, so it
    // no longer blocks the page behind a loader.
    const [isLoading, setIsLoading] = useState(false)
    const [userName, setUserName] = useState<string | null>(null)
    const [isChatDisabled, setIsChatDisabled] = useState(false)
    const [isAdminMode, setIsAdminMode] = useState(false)

    // Expose startChat for manual initialization
    const startChat = async (name?: string, forceReset: boolean = true): Promise<string | null> => {
        try {
            if (forceReset) {
                // Clear previous state immediately to prevent "flashing" old data
                setMessages([])
                setConversationId(null)
                setUserId(null)
                setIsAdminMode(false)
            }

            // 1. Force New Session (User wanted to start fresh)
            if (forceReset) {
                const { data: { session: existingSession } } = await supabase.auth.getSession()
                if (existingSession) {
                    await supabase.auth.signOut()
                }
            }

            // 2. Ensure Auth (Anonymous)
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                const { error: authError } = await supabase.auth.signInAnonymously()
                if (authError) {
                    console.error("ChatProvider: Auth error", authError)
                    return null
                }
            }

            // 3. Start/Resume Session
            const res = await fetch('/api/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })

            if (!res.ok) {
                console.error("ChatProvider: Failed to start chat session")
                return null
            }
            const data = await res.json()
            setConversationId(data.conversationId)
            setUserId(data.userId)
            setIsAdminMode(data.isAdminMode || false)

            // Set name locally if we just provided it
            if (name) {
                setUserName(name)
            } else {
                // Otherwise fetch profile
                const { data: profile } = await supabase.from('users').select('name').eq('id', data.userId).single()
                if (profile?.name) {
                    setUserName(profile.name)
                }
            }

            if (data.messages && data.messages.length > 0) {
                setMessages(data.messages)
            }
            return data.conversationId

        } catch (err) {
            console.error("ChatProvider: Initialization error", err)
            return null
        }
    }

    // Auto-init on mount to track visitor
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Check if we already have a session/convo to avoid double-init if StrictMode is on
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    // We have a session, assume user is returning - Resume
                    if (mounted && !conversationId) {
                        await startChat(undefined, false); // Resume, don't reset
                    }
                }
                // New visitors get a session with their first message.
            } catch (error) {
                console.error("ChatProvider: Init error", error);
            }
        };

        init();

        return () => { mounted = false };
    }, []); // Run once on mount

    const addMessage = (message: { role: 'user' | 'bot', content: string, component?: ReactNode }) => {
        setMessages(prev => [...prev, message])
    }

    // Realtime Listener for Admin Messages & Status
    useEffect(() => {
        if (!conversationId) return

        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as any
                    // Prevent duplicates (if we sent it ourselves)
                    // We only want to auto-add if it's from 'admin' 
                    if (newMsg.sender_type === 'admin') {
                        setMessages((prev) => {
                            // Dedupe check just in case
                            if (prev.some(m => (m as any).id === newMsg.id)) return prev

                            return [...prev, {
                                role: 'admin',
                                content: newMsg.content,
                                id: newMsg.id
                            } as any]
                        })
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `id=eq.${conversationId}`
                },
                (payload) => {
                    const newConvo = payload.new as any
                    // Sync Admin Mode instantly
                    // If assigned_admin_id is present (truthy), admin mode is ON
                    // If null/empty, admin mode is OFF
                    setIsAdminMode(!!newConvo.assigned_admin_id)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, supabase])

    // Presence Channel Ref (to use in cleanup)
    const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Presence Tracking (Global Room)
    useEffect(() => {
        if (!conversationId) return

        // Dedicated 'room:chat-presence' to avoid conflicts with other components
        const channel = supabase.channel('room:chat-presence', {
            config: {
                presence: {
                    key: conversationId, // Use convo ID as the unique presence key
                },
            },
        })

        presenceChannelRef.current = channel

        channel.on('presence', { event: 'sync' }, () => {
            // We just track our own presence
        })

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    online_at: new Date().toISOString(),
                    conversationId: conversationId,
                })
            } else if (status === 'CHANNEL_ERROR') {
                console.error("Presence channel error - retrying...")
                // Retry subscription after a delay
                setTimeout(() => {
                    channel.subscribe()
                }, 2000)
            }
        })

        // Keep-Alive: Database Heartbeat + Re-track presence (Robust)
        const keepAlive = setInterval(async () => {
            // Database heartbeat
            await supabase
                .from('conversations')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', conversationId)

            // Re-track presence to keep it fresh (handles stale connections)
            if (presenceChannelRef.current) {
                presenceChannelRef.current.track({
                    online_at: new Date().toISOString(),
                    conversationId: conversationId,
                    location: "Active" // Simplified for heartbeat
                }).catch(() => {
                    // Ignore tracking errors during heartbeat
                })
            }
        }, 15000) // Update every 15s

        return () => {
            clearInterval(keepAlive)
            presenceChannelRef.current = null
            supabase.removeChannel(channel)
        }
    }, [conversationId])

    // Aggressive Cleanup on Tab Close (Instant Offline)
    useEffect(() => {
        if (!conversationId) return

        const handleUnload = () => {
            // Use the stored channel reference for proper untrack
            if (presenceChannelRef.current) {
                try {
                    presenceChannelRef.current.untrack()
                } catch (e) {
                    // Ignore errors during unload
                }
            }
            // Backup: Remove all channels
            supabase.removeAllChannels()
        }

        // Handle both unload and visibility change (for mobile)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Re-track with "away" status when tab is hidden
                if (presenceChannelRef.current) {
                    presenceChannelRef.current.track({
                        online_at: new Date().toISOString(),
                        conversationId: conversationId,
                        status: 'away'
                    }).catch(() => {})
                }
            } else if (document.visibilityState === 'visible') {
                // Re-track as active when tab becomes visible
                if (presenceChannelRef.current) {
                    presenceChannelRef.current.track({
                        online_at: new Date().toISOString(),
                        conversationId: conversationId,
                        status: 'active'
                    }).catch(() => {})
                }
            }
        }

        window.addEventListener('beforeunload', handleUnload)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.removeEventListener('beforeunload', handleUnload)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [conversationId])

    const sendMessage = async (content: string, intent?: string, activeId?: string) => {
        if (!content.trim()) return

        // Optimistic UI for user message
        const optimisticId = Date.now().toString()
        setMessages(prev => [...prev, { role: 'user', content, id: optimisticId } as any])

        // ONLY show the typing indicator if NOT in admin mode
        if (!isAdminMode) setIsLoading(true)

        const botError = (text: string) =>
            setMessages(prev => [...prev, { role: 'bot', content: text }])

        try {
            // First message from a new visitor: start their session now.
            let currentId = activeId || conversationId
            if (!currentId) {
                currentId = await startChat(undefined, false)
                if (!currentId) {
                    botError("I couldn't connect just now. Check your connection and send that again.")
                    return
                }
            }

            const post = (id: string) => fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: id, content, intent })
            })

            let res = await post(currentId)

            // Retry once on 401 (expired/invalid session)
            if (res.status === 401) {
                const newId = await startChat()
                if (newId) res = await post(newId)
            }

            // Streamed LLM reply: show it as it arrives.
            if (res.ok && res.headers.get('content-type')?.startsWith('text/plain') && res.body) {
                const replyId = `bot-${optimisticId}`
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let text = ''
                let started = false
                for (;;) {
                    const { value, done } = await reader.read()
                    if (done) break
                    text += decoder.decode(value, { stream: true })
                    if (!started) {
                        started = true
                        setIsLoading(false)
                        setMessages(prev => [...prev, { role: 'bot', content: text, id: replyId, streaming: true } as any])
                    } else {
                        setMessages(prev => prev.map(m => (m as any).id === replyId ? { ...m, content: text } : m))
                    }
                }
                text += decoder.decode()
                setMessages(prev => prev.map(m => (m as any).id === replyId ? { ...m, content: text, streaming: false } as any : m))
                if (!started) botError("I didn't get a reply that time. Please ask again.")
                return
            }

            const data = await res.json().catch(() => ({}))

            if (res.ok) {
                if (data.limitReached) setIsChatDisabled(true)
                // If the backend says manual_mode, update our local state
                if (data.status === 'manual_mode') setIsAdminMode(true)
                if (data.reply) setMessages(prev => [...prev, { role: 'bot', content: data.reply }])
            } else {
                console.error("ChatProvider: Send error", data.error)
                botError(data.error && res.status === 429 ? data.error : "That message didn't go through. Please try again.")
            }
        } catch (err) {
            console.error("ChatProvider: Network error", err)
            botError("I couldn't reach the server. Check your connection and try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <ChatContext.Provider value={{
            conversationId,
            userId,
            messages,
            sendMessage,
            addMessage,
            isLoading,
            userName,
            setUserName,
            startChat,
            isChatDisabled,
            isAdminMode
        }}>
            {children}
        </ChatContext.Provider>
    )
}

export function useChat() {
    const context = useContext(ChatContext)
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider")
    }
    return context
}
