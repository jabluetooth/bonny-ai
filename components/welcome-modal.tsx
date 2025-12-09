"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChat } from "@/components/chat-provider"

export function WelcomeModal() {
    const { conversationId, startChat, isLoading, isWelcomeOpen, setIsWelcomeOpen } = useChat()
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
        <Dialog open={isWelcomeOpen} onOpenChange={() => { /* Prevent closing by clicking outside during welcome */ }}>
            <DialogContent className="sm:max-w-[425px] [&>button]:hidden"> {/* Hide Close X */}
                <DialogHeader>
                    <DialogTitle>Welcome to Bonny AI</DialogTitle>
                    <DialogDescription>
                        Please identify yourself to get started, or continue anonymously.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="welcome-name" className="text-right text-sm font-medium">
                            Name
                        </label>
                        <Input
                            id="welcome-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="Your name (optional)"
                            onKeyDown={(e) => e.key === 'Enter' && handleStartWithName()}
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleSkip} disabled={isLoading}>
                        Continue Anonymously
                    </Button>
                    <Button type="submit" onClick={handleStartWithName} disabled={isLoading || !name.trim()}>
                        {isLoading ? "Starting..." : "Start Chat"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
