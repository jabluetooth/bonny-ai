"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase-client"

interface ChatContextType {
    conversationId: string | null
    userId: string | null
    messages: { role: 'user' | 'bot', content: string }[]
    sendMessage: (content: string) => Promise<void>
    isLoading: boolean
    userName: string | null
    setUserName: (name: string) => void
    startChat: (name?: string) => Promise<void>
    isWelcomeOpen: boolean
    setIsWelcomeOpen: (open: boolean) => void
    welcomePlaceholder: string
}

const ChatContext = createContext<ChatContextType>({
    conversationId: null,
    userId: null,
    messages: [],
    sendMessage: async () => { },
    isLoading: false,
    userName: null,
    setUserName: () => { },
    startChat: async () => { },
    isWelcomeOpen: false,
    setIsWelcomeOpen: () => { },
    welcomePlaceholder: "|"
})

export function ChatProvider({ children }: { children: ReactNode }) {
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [userName, setUserName] = useState<string | null>(null)
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([])

    // Create client once
    const [supabase] = useState(() => createClient())

    // Expose startChat for manual initialization
    const startChat = async (name?: string) => {
        try {
            // 1. Check/Create Auth
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                const { error: authError } = await supabase.auth.signInAnonymously()
                if (authError) {
                    console.error("ChatProvider: Auth error", authError)
                    return
                }
            }

            // 2. Start Session (Pass name if provided)
            const res = await fetch('/api/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })

            if (!res.ok) {
                console.error("ChatProvider: Failed to start chat session")
                return
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

            if (data.messages) {
                setMessages(data.messages)
            }
            console.log("ChatProvider: Session started (or recovered)", data.conversationId)

        } catch (err) {
            console.error("ChatProvider: Initialization error", err)
        }
    }






    const sendMessage = async (content: string) => {
        if (!conversationId) {
            console.error("ChatProvider: No active conversation")
            return
        }
        if (!content.trim()) return

        // Optimistic UI
        setMessages(prev => [...prev, { role: 'user', content }])
        setIsLoading(true)

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, content })
            })
            const data = await res.json()

            if (res.ok) {
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
            isLoading,
            userName,
            setUserName,
            startChat,
            isWelcomeOpen,
            setIsWelcomeOpen,
            welcomePlaceholder
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
