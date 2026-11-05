"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useChat } from "@/components/chat-provider"

export function WelcomeModal() {
    const { conversationId, startChat, isLoading, isWelcomeOpen, setIsWelcomeOpen } = useChat()
    const [name, setName] = useState("")
    const [initializing, setInitializing] = useState(true)

    // Only show if not connected and not loading (after initial check)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!conversationId && !isLoading) {
                setIsWelcomeOpen(true)
            }
            setInitializing(false)
        }, 100)
        return () => clearTimeout(timer)
    }, [conversationId, isLoading, setIsWelcomeOpen])

    const handleStartWithName = async () => {
        if (!name.trim()) return
        await startChat(name.trim())
        setIsWelcomeOpen(false)
    }

    const handleSkip = async () => {
        await startChat("Guest")
        setIsWelcomeOpen(false)
    }

    if (initializing && !isWelcomeOpen) return null

    return (
        <Dialog open={isWelcomeOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="sm:max-w-[380px] p-6 border bg-background shadow-lg rounded-2xl outline-none"
            >
                <div className="space-y-1.5">
                    <DialogTitle className="text-lg font-semibold">Welcome</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Ask me about a problem in your business or about my work. Add your name and company so I can tailor the answers, or continue as a guest.
                    </DialogDescription>
                </div>

                <form
                    className="space-y-3 pt-2"
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleStartWithName()
                    }}
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="welcome-name" className="text-xs text-muted-foreground">Name (optional)</Label>
                        <Input
                            id="welcome-name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Maria, Acme Logistics"
                            autoComplete="name"
                            maxLength={80}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || !name.trim()}>
                        Start
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={handleSkip} disabled={isLoading}>
                        Continue as guest
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
