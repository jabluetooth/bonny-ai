"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Bot, Bell, Shield, LogOut, Save, Laptop } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"

export function SettingsView() {
    const [isLoading, setIsLoading] = useState(false)

    // --- Settings State ---
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [notificationsEnabled, setNotificationsEnabled] = useState(false)
    const [systemPrompt, setSystemPrompt] = useState(`You are Fil Heinz O. Re La Torre, a passionate and innovative Software Engineer.
This is YOUR portfolio website. You are chatting with a visitor who is interested in your work.

YOUR GOAL:
Impress the visitor with your skills and projects. Be helpful, enthusiastic, and professional.`)

    // Check Notification Permission on load
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setNotificationsEnabled(Notification.permission === "granted")
        }
    }, [])

    const handleSavePrompt = () => {
        setIsLoading(true)
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            toast.success("AI Persona updated successfully!")
        }, 800)
    }

    const toggleNotifications = async () => {
        if (!notificationsEnabled) {
            const permission = await Notification.requestPermission()
            if (permission === "granted") {
                setNotificationsEnabled(true)
                toast.success("Browser notifications enabled")
                new Notification("Test Notification", { body: "Notifications are working!" })
            } else {
                toast.error("Permission denied. Check browser settings.")
            }
        } else {
            // Just local disable, can't revoke permission programmatically
            setNotificationsEnabled(false)
            toast.info("Notifications disabled")
        }
    }

    const handleSignOut = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Manage your AI, preferences, and security.</p>
                </div>
            </div>

            <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" /> AI Brain
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Security
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB 1: AI BRAIN --- */}
                <TabsContent value="ai" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Persona</CardTitle>
                            <CardDescription>
                                Define how your AI assistant should behave, speak, and interact with visitors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="prompt">System Prompt</Label>
                                <Textarea
                                    id="prompt"
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    className="min-h-[300px] font-mono text-sm leading-relaxed"
                                    placeholder="You are..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Changes take effect immediately for new conversations. Use markdown for formatting.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 flex justify-end px-6 py-4">
                            <Button onClick={handleSavePrompt} disabled={isLoading}>
                                {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* --- TAB 2: NOTIFICATIONS --- */}
                <TabsContent value="notifications" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alert Preferences</CardTitle>
                            <CardDescription>
                                Control how you want to be notified when a visitor interacts with the chat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="sound-alerts" className="flex flex-col space-y-1">
                                    <span>Sound Alerts</span>
                                    <span className="font-normal text-xs text-muted-foreground">Play a sound when a new message arrives.</span>
                                </Label>
                                <Switch id="sound-alerts" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="browser-notifs" className="flex flex-col space-y-1">
                                    <span>Browser Notifications</span>
                                    <span className="font-normal text-xs text-muted-foreground">Show a popup bubble on your desktop.</span>
                                </Label>
                                <Switch id="browser-notifs" checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 3: SECURITY --- */}
                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Security</CardTitle>
                            <CardDescription>
                                Manage your admin session and credentials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Admin Session</Label>
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <Laptop className="h-5 w-5 text-muted-foreground" />
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">Current Session</p>
                                            <p className="text-xs text-muted-foreground">Active now</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full font-medium">
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <Button variant="destructive" className="w-full sm:w-auto" onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
