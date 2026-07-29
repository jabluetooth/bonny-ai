"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"
import { RefreshCw, Sparkles } from "lucide-react"

interface ContentEdit {
    id: string
    table_name: string
    record_id: string
    action: "created" | "updated"
    before: Record<string, unknown> | null
    after: Record<string, unknown> | null
    github_delivery_id: string | null
    session_id: string | null
    created_at: string
}

export function AiAgentView() {
    const [enabled, setEnabled] = useState<boolean | null>(null)
    const [isToggling, setIsToggling] = useState(false)
    const [edits, setEdits] = useState<ContentEdit[]>([])
    const [isLoadingEdits, setIsLoadingEdits] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/agent-settings")
            if (!res.ok) throw new Error("Failed to load agent settings")
            const data = await res.json()
            setEnabled(data.enabled)
        } catch (error) {
            console.error("Error loading agent settings:", error)
            toast.error("Failed to load AI agent status")
        }
    }, [])

    const fetchEdits = useCallback(async () => {
        setIsLoadingEdits(true)
        try {
            const res = await fetch("/api/admin/content-edits?limit=25")
            if (!res.ok) throw new Error("Failed to load activity")
            const data = await res.json()
            setEdits(data.edits || [])
        } catch (error) {
            console.error("Error loading AI activity:", error)
            toast.error("Failed to load AI activity")
        } finally {
            setIsLoadingEdits(false)
        }
    }, [])

    useEffect(() => {
        fetchSettings()
        fetchEdits()
    }, [fetchSettings, fetchEdits])

    async function handleToggle(next: boolean) {
        const previous = enabled
        setEnabled(next)
        setIsToggling(true)
        try {
            const res = await fetch("/api/admin/agent-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: next }),
            })
            if (!res.ok) throw new Error("Failed to update")
            toast.success(next ? "AI content agent enabled" : "AI content agent disabled")
        } catch (error) {
            console.error("Error updating agent settings:", error)
            setEnabled(previous)
            toast.error("Failed to update AI agent status")
        } finally {
            setIsToggling(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">AI Content Agent</h2>
                <p className="text-muted-foreground">
                    Automatically updates your Projects section from GitHub pushes.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" /> GitHub Content Agent
                    </CardTitle>
                    <CardDescription>
                        When enabled, a push to an allow-listed GitHub repo triggers the agent to review the change
                        and create or update the matching project entry.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg bg-muted/20">
                        <Label htmlFor="agent-toggle" className="flex flex-col space-y-1">
                            <span className="font-medium">
                                {enabled === null ? "Loading..." : enabled ? "Enabled" : "Disabled"}
                            </span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Turn off to stop the agent from making any changes, without touching your webhook
                                configuration on GitHub.
                            </span>
                        </Label>
                        <Switch
                            id="agent-toggle"
                            checked={enabled ?? false}
                            disabled={enabled === null || isToggling}
                            onCheckedChange={handleToggle}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Every change the agent has made, most recent first.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchEdits} disabled={isLoadingEdits}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingEdits ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>When</TableHead>
                                    <TableHead>Table</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead className="hidden md:table-cell">GitHub Delivery</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingEdits ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : edits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No AI edits yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    edits.map((edit) => (
                                        <React.Fragment key={edit.id}>
                                            <TableRow>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(edit.created_at), "MMM d, HH:mm")}
                                                </TableCell>
                                                <TableCell className="font-medium">{edit.table_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={edit.action === "created" ? "default" : "secondary"}>
                                                        {edit.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-xs text-muted-foreground truncate max-w-[180px]">
                                                    {edit.github_delivery_id || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setExpandedId(expandedId === edit.id ? null : edit.id)}
                                                    >
                                                        {expandedId === edit.id ? "Hide" : "View"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {expandedId === edit.id && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="bg-muted/20">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground mb-1">Before</p>
                                                                <pre className="text-xs bg-background border rounded-md p-3 overflow-x-auto max-h-64">
                                                                    {edit.before ? JSON.stringify(edit.before, null, 2) : "(new record)"}
                                                                </pre>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground mb-1">After</p>
                                                                <pre className="text-xs bg-background border rounded-md p-3 overflow-x-auto max-h-64">
                                                                    {JSON.stringify(edit.after, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
