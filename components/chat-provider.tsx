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
    isWelcomeOpen: boolean
    setIsWelcomeOpen: (open: boolean) => void
    welcomePlaceholder: string
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
    isWelcomeOpen: false,
    setIsWelcomeOpen: () => { },
    welcomePlaceholder: "|",
    isChatDisabled: false,
    isAdminMode: false
})

export function ChatProvider({ children }: { children: ReactNode }) {
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [messages, setMessages] = useState<{ role: 'user' | 'bot' | 'admin', content: string, component?: ReactNode, id?: string }[]>([])
    const [isLoading, setIsLoading] = useState(true) // Default to true to prevent flash
    const [userName, setUserName] = useState<string | null>(null)
    const [isChatDisabled, setIsChatDisabled] = useState(false)
    const [isAdminMode, setIsAdminMode] = useState(false)

    // --- Typing Animation Logic (Lifted State) ---
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
    const [welcomePlaceholder, setWelcomePlaceholder] = useState("|")
    const [phraseIndex, setPhraseIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isPausing, setIsPausing] = useState(false)

    // Use singleton directly (removed state)

    // Expose startChat for manual initialization
    const startChat = async (name?: string, forceReset: boolean = true): Promise<string | null> => {
        try {
            // Only set loading if we are resetting or don't have an ID
            if (forceReset || !conversationId) setIsLoading(true)

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
            console.log("ChatProvider: Session started (or recovered)", data.conversationId)
            return data.conversationId

        } catch (err) {
            console.error("ChatProvider: Initialization error", err)
            return null
        } finally {
            setIsLoading(false)
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
                } else {
                    // User is new (No session) -> Do NOT auto-start.
                    if (mounted) {
                        setIsLoading(false); // Stop loading so Modal can appear
                    }
                }
            } catch (error) {
                console.error("ChatProvider: Init error", error);
                if (mounted) setIsLoading(false);
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

        channel.on('presence', { event: 'sync' }, () => {
            // We just track our own presence
        })

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    online_at: new Date().toISOString(),
                    conversationId: conversationId
                })
            }
        })

        // Keep-Alive: Database Heartbeat (Robust)
        const keepAlive = setInterval(async () => {
            await supabase
                .from('conversations')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', conversationId)
        }, 10000) // Update DB every 10s

        return () => {
            clearInterval(keepAlive)
            supabase.removeChannel(channel)
        }
    }, [conversationId, supabase])

    // Aggressive Cleanup on Tab Close (Instant Offline)
    useEffect(() => {
        if (!conversationId) return

        const handleUnload = () => {
            // 1. Explicitly untrack presence (sends 'leave')
            const channel = supabase.channel('room:chat-presence')
            channel.untrack().then(() => {
                // 2. Kill socket connection
                supabase.removeAllChannels()
            })

            // Backup: Fire and forget remove if untrack hangs
            supabase.removeAllChannels()
        }

        window.addEventListener('beforeunload', handleUnload)
        return () => window.removeEventListener('beforeunload', handleUnload)
    }, [conversationId])

    const sendMessage = async (content: string, intent?: string, activeId?: string) => {
        const currentId = activeId || conversationId;

        if (!currentId) {
            console.error("ChatProvider: No active conversation")
            return
        }
        if (!content.trim()) return

        // Optimistic UI for user message
        const optimisticId = Date.now().toString()
        setMessages(prev => [...prev, { role: 'user', content, id: optimisticId } as any])

        // ONLY show loading if NOT in admin mode
        if (!isAdminMode) {
            setIsLoading(true)
        }

        try {
            let res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: currentId, content, intent })
            })

            // Retry Logic for 401 (Expired/Invalid Session)
            if (res.status === 401) {
                console.log("ChatProvider: Session expired, refreshing...");
                const newId = await startChat(); // Refresh session
                if (newId) {
                    // Retry send with new ID
                    res = await fetch('/api/chat/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ conversationId: newId, content, intent })
                    })
                }
            }

            const data = await res.json()

            if (res.ok) {
                if (data.limitReached) {
                    setIsChatDisabled(true)
                }

                // If the backend says manual_mode, update our local state
                if (data.status === 'manual_mode') {
                    setIsAdminMode(true)
                }

                // Determine if we should add bot reply
                if (data.reply) {
                    setMessages(prev => [...prev, { role: 'bot', content: data.reply }])
                }
            } else {
                console.error("ChatProvider: Send error", data.error)
                setMessages(prev => [...prev, { role: 'bot', content: "Error: Could not send message." }])
            }

        } catch (err) {
            console.error("ChatProvider: Network error", err)
            setMessages(prev => [...prev, { role: 'bot', content: "Network error." }])
        } finally {
            setIsLoading(false)
        }
    }

    const phrases = [
        "welcome to bonny ai",
        "my name is fil heinz",
        "write your name here.."
    ]

    useEffect(() => {
        // Only run animation if welcome modal is open (or generally if we want it active during onboarding)
        if (!isWelcomeOpen) return

        const currentPhrase = phrases[phraseIndex]

        let timeoutDuration = isDeleting ? 50 : 100
        if (isPausing) timeoutDuration = 2000

        const timeout = setTimeout(() => {
            if (isPausing) {
                setIsPausing(false)
                setIsDeleting(true)
                return
            }

            if (!isDeleting) {
                if (charIndex < currentPhrase.length) {
                    setCharIndex(prev => prev + 1)
                } else {
                    setIsPausing(true)
                }
            } else {
                if (charIndex > 0) {
                    setCharIndex(prev => prev - 1)
                } else {
                    setIsDeleting(false)
                    setPhraseIndex((prev) => (prev + 1) % phrases.length)
                }
            }
        }, timeoutDuration)

        setWelcomePlaceholder(currentPhrase.substring(0, charIndex) + "|")

        return () => clearTimeout(timeout)
    }, [charIndex, isDeleting, isPausing, phraseIndex, isWelcomeOpen])


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
            isWelcomeOpen,
            setIsWelcomeOpen,
            welcomePlaceholder,
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
