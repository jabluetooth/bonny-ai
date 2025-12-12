"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChat } from "@/components/chat-provider"

export function WelcomeModal() {
    const { conversationId, startChat, isLoading, isWelcomeOpen, setIsWelcomeOpen } = useChat()
    const [name, setName] = useState("")
    const [initializing, setInitializing] = useState(true)

    // --- Local Typing Animation State ---
    const [placeholder, setPlaceholder] = useState("|")
    const [phraseIndex, setPhraseIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isPausing, setIsPausing] = useState(false)
    const [isInteracted, setIsInteracted] = useState(false)

    const phrases = [
        "welcome to bonny ai",
        "my name is fil heinz",
        "write your name here.."
    ]

    useEffect(() => {
        // Stop animation if user has interacted or modal is closed
        if (!isWelcomeOpen || isInteracted) return

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

        setPlaceholder(currentPhrase.substring(0, charIndex) + "|")

        return () => clearTimeout(timeout)
    }, [charIndex, isDeleting, isPausing, phraseIndex, isWelcomeOpen, isInteracted])

    // Only show if not connected and not loading (after initial check)
    useEffect(() => {
        // Wait a small tick to ensure hydration is settled (though auto-hydrate is removed, good for safety)
        const timer = setTimeout(() => {
            if (!conversationId && !isLoading) {
                setIsWelcomeOpen(true)
            }
            setInitializing(false)
        }, 100)
        return () => clearTimeout(timer)
    }, [conversationId, isLoading, setIsWelcomeOpen])

    // If connected, close
    useEffect(() => {
        if (conversationId) {
            setIsWelcomeOpen(false)
        }
    }, [conversationId, setIsWelcomeOpen])

    const handleStartWithName = async () => {
        if (!name.trim()) return
        await startChat(name)
        setIsWelcomeOpen(false)
    }

    const handleSkip = async () => {
        await startChat("Guest")
        setIsWelcomeOpen(false)
    }

    if (initializing && !isWelcomeOpen) return null

    return (
        <Dialog open={isWelcomeOpen} onOpenChange={() => { /* Prevent closing */ }}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="sm:max-w-[330px] p-6 border bg-background shadow-lg rounded-2xl outline-none"
            >
                <DialogTitle className="sr-only">Welcome</DialogTitle>
                <DialogDescription className="sr-only">
                    Please enter your name or continue anonymously to start chatting.
                </DialogDescription>
                <div className="flex flex-col items-center justify-center space-y-6">

                    {/* Input Section */}
                    <div className="w-full">
                        <Input
                            id="welcome-name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => {
                                setIsInteracted(true)
                                setPlaceholder("Write your name here...")
                            }}
                            onBlur={() => setIsInteracted(false)}
                            className="h-12 rounded-full bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 text-center text-lg placeholder:text-muted-foreground/50 transition-all font-light"
                            placeholder={isInteracted ? "Write your name here..." : placeholder}
                            onKeyDown={(e) => e.key === 'Enter' && handleStartWithName()}
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full opacity-60">
                        <div className="h-[1px] bg-border flex-1" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">or</span>
                        <div className="h-[1px] bg-border flex-1" />
                    </div>

                    {/* Anonymous Button */}
                    <Button
                        onClick={handleSkip}
                        disabled={isLoading}
                        variant="outline"
                        className="rounded-full h-11 px-8 w-full border-muted-foreground/20 hover:bg-black hover:text-white hover:border-black font-normal transition-all"
                    >
                        Enter Anonymously
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
