"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, Play, Pause, RefreshCcw, ArrowLeft, Volume2, VolumeX, Bell, BellOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { useAdminChat } from "@/hooks/use-admin-chat"
import { useAdminSettings } from "@/hooks/use-admin-settings"

interface Conversation {
    id: string
    created_at: string
    updated_at: string
    messages: Message[]
    user_id?: string
    assigned_admin_id?: string
}

interface Message {
    id: string
    content: string
    sender_type: 'user' | 'bot' | 'admin'
    created_at: string
    conversation_id?: string // Added for navigation
}

export function ChatManager() {
    const {
        soundEnabled,
        setSoundEnabled,
        notificationsEnabled,
        setNotificationsEnabled
    } = useAdminSettings()

    const { conversations, isLoading, refresh, onlineUsers } = useAdminChat({
        onNewMessage: (msg) => {
            // Only notify for USER messages
            if (msg.sender_type === 'user') {
                // 1. Toast Notification (Always Visible)
                toast.info(`Visitor: ${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}`)

                // 2. Sound
                if (soundEnabled) {
                    const audio = new Audio("/notification.mp3")
                    audio.play().catch(e => console.log("Audio play failed (file missing?):", e))
                }

                // 3. Browser Notification
                if (notificationsEnabled && Notification.permission === "granted") {
                    new Notification("New Message", {
                        body: msg.content,
                        icon: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/bot-avatar.png?t=${Number(Date.now() / 60000).toFixed(0)}`,
                        tag: "new-message"
                    })
                }
            }
        }
    })

    // Local UI State
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [msgInput, setMsgInput] = useState("")

    // Supabase Client for Actions
    const [supabase] = useState(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ))

    const selectedConv = conversations.find(c => c.id === selectedId)

    // Calculate online count directly from the real-time set
    const onlineCount = conversations.filter(c => onlineUsers.has(c.id)).length

    // Sort and limit conversations
    const displayConversations = [...conversations]
        .sort((a, b) => {
            const aOnline = onlineUsers.has(a.id)
            const bOnline = onlineUsers.has(b.id)
            if (aOnline && !bOnline) return -1
            if (!aOnline && bOnline) return 1
            return 0 // Keep original sort (by date)
        })
        .slice(0, 10)

    return (
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 h-[calc(100vh-200px)] min-h-[500px]">
            {/* List */}
            <Card className={cn("col-span-1 flex flex-col h-full", selectedId ? "hidden md:flex" : "flex")}>
                <CardHeader className="py-3 px-4 border-b">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex flex-col">
                            <span>Active Sessions</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                                {onlineCount} Online Now
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                title={soundEnabled ? "Mute Sound" : "Enable Sound"}
                            >
                                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                title={notificationsEnabled ? "Disable Desktop Notifications" : "Enable Desktop Notifications"}
                            >
                                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : (
                        <div className="divide-y">
                            {displayConversations.map((conv) => {
                                const isOnline = onlineUsers.has(conv.id)
                                const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null
                                return (
                                    <div
                                        key={conv.id}
                                        className={cn(
                                            "flex flex-col p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                            selectedId === conv.id && "bg-muted"
                                        )}
                                        onClick={() => setSelectedId(conv.id)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">Visitor {conv.id.slice(0, 6)}</span>
                                                {conv.assigned_admin_id && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">Taken Over</Badge>}
                                            </div>
                                            {isOnline && (
                                                <div className="flex items-center gap-1">
                                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {lastMsg ? lastMsg.content : "No messages yet"}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(new Date(conv.updated_at), 'MMM d, HH:mm')}
                                            </span>
                                            {lastMsg && lastMsg.sender_type === 'user' && (
                                                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </Card >

            {/* Chat Window */}
            < Card className={cn("col-span-1 md:col-span-2 flex-col h-full overflow-hidden", !selectedId ? "hidden md:flex" : "flex")} >
                {
                    selectedConv ? (
                        <ActiveChatWindow
                            conversation={selectedConv}
                            supabase={supabase}
                            refresh={refresh}
                            onBack={() => setSelectedId(null)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p>Select a conversation to monitor</p>
                        </div>
                    )
                }
            </Card >
        </div >
    )
}

function ActiveChatWindow({
    conversation,
    supabase,
    refresh,
    onBack
}: {
    conversation: Conversation,
    supabase: any,
    refresh: () => void,
    onBack: () => void
}) {
    const [input, setInput] = useState("")
    const [isSending, setIsSending] = useState(false)
    const logsRef = useRef<HTMLDivElement>(null)

    // Auto-scroll
    useEffect(() => {
        if (logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight
        }
    }, [conversation.messages])

    const handleTakeOver = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("You must be logged in to take over")
            return
        }

        const isTakingOver = !conversation.assigned_admin_id
        const { error } = await supabase
            .from('conversations')
            .update({ assigned_admin_id: isTakingOver ? user.id : null })
            .eq('id', conversation.id)

        if (error) toast.error("Failed: " + error.message)
        else {
            toast.success(isTakingOver ? "You are now controlling this chat" : "Bot mode resumed")
            refresh()
        }
    }

    const handleSend = async () => {
        if (!input.trim()) return
        setIsSending(true)

        // 1. Send Admin Message
        const { error } = await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_type: 'admin',
            content: input
        })

        if (error) {
            toast.error("Failed to send")
        } else {
            setInput("")
            // Ensure admin mode is ON if we send a message?
            if (!conversation.assigned_admin_id) {
                await supabase.from('conversations').update({ assigned_admin_id: 'ADMIN' }).eq('id', conversation.id)
            }
            refresh()
        }
        setIsSending(false)
    }

    return (
        <>
            <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden -ml-2" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold">Visitor {conversation.id.slice(0, 6)}</span>
                    {conversation.assigned_admin_id ?
                        <Badge variant="destructive" className="gap-1"><Pause className="w-3 h-3" /> Bot Paused</Badge> :
                        <Badge variant="secondary" className="gap-1"><Play className="w-3 h-3" /> Bot Active</Badge>
                    }
                </div>
                <Button
                    variant={conversation.assigned_admin_id ? "outline" : "default"}
                    size="sm"
                    onClick={handleTakeOver}
                >
                    {conversation.assigned_admin_id ? "Resume Bot" : "Take Over"}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={logsRef}>
                {conversation.messages.map((msg) => {
                    const isUser = msg.sender_type === 'user'
                    const isAdmin = msg.sender_type === 'admin'
                    return (
                        <div key={msg.id} className={cn("flex", isUser ? "justify-start" : "justify-end")}>
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                    isUser ? "bg-muted text-muted-foreground rounded-tl-none" :
                                        isAdmin ? "bg-red-500 text-white rounded-tr-none" :
                                            "bg-primary text-primary-foreground rounded-tr-none"
                                )}
                            >
                                <p>{msg.content}</p>
                                <span className="text-[10px] opacity-70 block mt-1">
                                    {isAdmin ? "Admin" : isUser ? "Visitor" : "Bot"} • {format(new Date(msg.created_at), 'HH:mm')}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="p-3 border-t">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={!conversation.assigned_admin_id}
                    />
                    <Button onClick={handleSend} disabled={!input.trim() || isSending || !conversation.assigned_admin_id}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                {!conversation.assigned_admin_id && (
                    <p className="text-[10px] text-muted-foreground mt-1 ml-1">Take over conversation to enable chat.</p>
                )}
            </div>
        </>
    )
}
