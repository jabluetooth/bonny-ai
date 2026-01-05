"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAdminChat } from "@/hooks/use-admin-chat"
import { useAdminSettings } from "@/hooks/use-admin-settings"
import { format, subHours, startOfHour, isSameHour } from "date-fns"
import { Users, MessageSquare, Activity, MapPin, Zap, Clock, BarChart3, LayoutDashboard, Settings, BookOpen, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { toast } from "sonner"

export function DashboardOverview() {
    const { soundEnabled, notificationsEnabled } = useAdminSettings()

    const { conversations, onlineUsers, userLocations, isLoading } = useAdminChat({
        onNewMessage: (msg) => {
            console.log("[DashboardOverview] New message received:", msg) // Debug log

            if (msg.sender_type === 'user') {
                // Toast (always)
                toast.info(`Visitor: ${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}`)

                // Sound
                if (soundEnabled) {
                    const audio = new Audio("/notification.mp3")
                    audio.play().catch(e => console.log("Audio play failed:", e))
                }

                // Desktop Notification
                if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
                    new Notification("New Message", {
                        body: msg.content,
                        icon: "/bot-avatar.png",
                        tag: "new-message"
                    })
                }
            }
        }
    })

    // Derived Metrics
    const onlineCount = conversations.filter(c => onlineUsers.has(c.id)).length
    const totalConversations = conversations.length

    // Sort online users first for the "Live View"
    const liveSessions = conversations.filter(c => onlineUsers.has(c.id))

    // Recent Activity (Combined messages from all chats)
    const recentActivity = conversations
        .flatMap(c => c.messages.map(m => ({ ...m, conversationId: c.id })))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10) // Show more since we have space

    // --- Graph Data: Activity Volume (Messages per Hour - Last 24h) ---
    // 1. Generate last 12h buckets
    const now = new Date()
    const hours = Array.from({ length: 12 }, (_, i) => {
        const d = subHours(startOfHour(now), 11 - i) // Last 12 hours
        return d
    })

    // 2. Flatten all messages
    const allMessages = conversations.flatMap(c => c.messages.map(m => new Date(m.created_at)))

    // 3. Count messages per hour bucket
    const graphData = hours.map(hour => {
        const count = allMessages.filter(msgDate => isSameHour(msgDate, hour)).length
        return {
            time: format(hour, "ha"), // e.g. "2pm"
            messages: count
        }
    })

    return (
        <div className="flex flex-col gap-6">
            {/* ROW 1: Top Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Live Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{onlineCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Active on the site right now
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalConversations}</div>
                        <p className="text-xs text-muted-foreground">
                            All recorded sessions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">Live</div>
                        <p className="text-xs text-muted-foreground">
                            Real-time socket connected
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ROW 2: Graph & Quick Actions */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Graph (4/7) */}
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" /> Message Volume
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData}>
                                    <XAxis
                                        dataKey="time"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="messages" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions (3/7) - Moved up to sit next to graph */}
                <Card className="md:col-span-3">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4" /> Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="justify-start gap-2 h-auto py-4" asChild>
                            <Link href="/admin?view=chats">
                                <LayoutDashboard className="h-5 w-5 text-primary" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">View Chats</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">Manage sessions</span>
                                </div>
                            </Link>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-4" asChild>
                            <Link href="/admin?view=projects">
                                <Briefcase className="h-5 w-5 text-primary" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">Projects</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">Update portfolio</span>
                                </div>
                            </Link>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-4" asChild>
                            <Link href="/admin?view=skills">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">Skills</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">Edit technical skills</span>
                                </div>
                            </Link>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-4" asChild>
                            <Link href="/admin?view=about">
                                <Users className="h-5 w-5 text-primary" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">Profile</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">Personal details</span>
                                </div>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ROW 3: Feeds (Aligned Top) */}
            <div className="grid gap-4 md:grid-cols-2 flex-1 min-h-[400px]">

                {/* Live Visitor Feed (1/2) */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle>Live Visitor View</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pr-2">
                        {liveSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                                <Users className="h-8 w-8 mb-2 opacity-50" />
                                <p>No active visitors right now.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {liveSessions.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                <span className="font-medium text-sm">Visitor {session.id.slice(0, 8)}...</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {userLocations.get(session.id) || "Unknown Location"}
                                                </span>
                                                <span>•</span>
                                                <span>Created: {format(new Date(session.created_at), "PPP p")}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-medium bg-muted px-2 py-1 rounded">
                                                {session.messages.length} messages
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity (1/2) - Wider & Aligned */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pr-1">
                        <div className="space-y-4">
                            {recentActivity.map((msg, idx) => (
                                <div key={idx} className="flex flex-col gap-1 text-xs border-l-2 pl-3 py-1 border-muted">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span className="font-semibold text-primary">{msg.sender_type === 'user' ? 'Visitor' : 'AI/Admin'}</span>
                                        <span>{format(new Date(msg.created_at), "HH:mm")}</span>
                                    </div>
                                    <p className="line-clamp-2 text-muted-foreground/80">{msg.content}</p>
                                </div>
                            ))}
                            {recentActivity.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs opacity-50 py-12">
                                    <Activity className="h-6 w-6 mb-1" />
                                    <span>No recent activity</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
