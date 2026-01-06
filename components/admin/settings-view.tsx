"use client"

import { useAdminSettings } from "@/hooks/use-admin-settings"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Bot, Bell, Shield, LogOut, Save, Laptop, Palette } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { AvatarUploader } from "./avatar-uploader"
import { ContactManager } from "@/components/admin/contact-manager"

export function SettingsView() {
    const [isLoading, setIsLoading] = useState(false)

    // --- Settings State ---
    const {
        soundEnabled,
        setSoundEnabled,
        notificationsEnabled,
        setNotificationsEnabled
    } = useAdminSettings()

    // System Prompt State
    const [systemPrompt, setSystemPrompt] = useState(`You are Fil Heinz O. Re La Torre, a passionate and innovative Software Engineer.
This is YOUR portfolio website. You are chatting with a visitor who is interested in your work.

YOUR GOAL:
Impress the visitor with your skills and projects. Be helpful, enthusiastic, and professional.`)

    const handleSavePrompt = () => {
        setIsLoading(true)
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            toast.success("AI Persona updated successfully!")
        }, 800)
    }

    const handleSignOut = async () => {
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
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" /> AI Brain
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Appearance
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
                                <Switch id="browser-notifs" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 3: APPEARANCE --- */}
                <TabsContent value="appearance" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Chat Appearance</CardTitle>
                            <CardDescription>
                                Customize how you and your AI bot appear to visitors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <AvatarUploader
                                label="Bot Avatar"
                                filePath="bot-avatar.png"
                                defaultPreview=""
                            />
                            <div className="border-t pt-6">
                                <AvatarUploader
                                    label="Your Avatar (Admin)"
                                    filePath="admin-avatar.png"
                                    defaultPreview=""
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 4: SECURITY --- */}
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

                    {/* Contact Links Manager */}
                    <div className="mt-6">
                        <ContactManager />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
