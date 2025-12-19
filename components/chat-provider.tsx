"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase-client"

interface ChatContextType {
    conversationId: string | null
    userId: string | null
    messages: { role: 'user' | 'bot', content: string, component?: ReactNode }[]
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
    isChatDisabled: false
})

export function ChatProvider({ children }: { children: ReactNode }) {
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [userName, setUserName] = useState<string | null>(null)
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string, component?: ReactNode }[]>([])
    const [isChatDisabled, setIsChatDisabled] = useState(false)

    // Create client once
    const [supabase] = useState(() => createClient())

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

                // 1. Force New Session (User wanted to start fresh)
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
                // If resuming, we might want to keep existing messages if we have them? 
                // But for now, trusting the backend history is safer for sync.
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
            // Check if we already have a session/convo to avoid double-init if StrictMode is on
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // We have a session, just ensure backend knows/syncs
                if (mounted && !conversationId) {
                    await startChat(undefined, false); // Resume, don't reset
                }
            } else {
                // User is new -> Start fresh (implicitly registers visitor)
                if (mounted && !conversationId) {
                    await startChat(undefined, false);
                }
            }
        };

        init();

        return () => { mounted = false };
    }, []); // Run once on mount

    const addMessage = (message: { role: 'user' | 'bot', content: string, component?: ReactNode }) => {
        setMessages(prev => [...prev, message])
    }

    const sendMessage = async (content: string, intent?: string, activeId?: string) => {
        const currentId = activeId || conversationId;

        if (!currentId) {
            console.error("ChatProvider: No active conversation")
            return
        }
        if (!content.trim()) return

        // Optimistic UI
        setMessages(prev => [...prev, { role: 'user', content }])
        setIsLoading(true)

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
                setMessages(prev => [...prev, { role: 'bot', content: data.reply }])
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

    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)

    // --- Typing Animation Logic (Lifted State) ---
    const [welcomePlaceholder, setWelcomePlaceholder] = useState("|")
    const [phraseIndex, setPhraseIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isPausing, setIsPausing] = useState(false)

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
            isChatDisabled
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
