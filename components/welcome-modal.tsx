"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChat } from "@/components/chat-provider"

export function WelcomeModal() {
    const { conversationId, startChat, isLoading, isWelcomeOpen, setIsWelcomeOpen, welcomePlaceholder } = useChat()
    const [name, setName] = useState("")
    const [initializing, setInitializing] = useState(true)

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
        await startChat()
        setIsWelcomeOpen(false)
    }

    if (initializing && !isWelcomeOpen) return null

    return (
        <Dialog open={isWelcomeOpen} onOpenChange={() => { /* Prevent closing */ }}>
            <DialogContent className="sm:max-w-[330px] p-6 border bg-background shadow-lg rounded-2xl outline-none">
                <DialogTitle className="sr-only">Welcome</DialogTitle>

                <div className="flex flex-col items-center justify-center space-y-6">

                    {/* Input Section */}
                    <div className="w-full">
                        <Input
                            id="welcome-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-14 rounded-full bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 text-center text-xl placeholder:text-foreground/90 transition-all font-normal"
                            placeholder={welcomePlaceholder}
                            onKeyDown={(e) => e.key === 'Enter' && handleStartWithName()}
                            autoFocus
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
