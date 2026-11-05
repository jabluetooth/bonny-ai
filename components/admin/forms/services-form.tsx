"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Pencil, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { ImageUploader } from "@/components/admin/image-uploader"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"

interface Service {
    id: string
    title: string
    problem: string
    solution: string
    outcome: string
    image_url: string | null
    display_order: number
    is_active: boolean
}

type ServiceDraft = Omit<Service, "id" | "display_order"> & { id?: string }

const EMPTY_DRAFT: ServiceDraft = {
    title: "",
    problem: "",
    solution: "",
    outcome: "",
    image_url: null,
    is_active: true,
}

export function AdminServicesForm() {
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

    const fetchServices = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from("services")
            .select("*")
            .order("display_order", { ascending: true })

        if (error) {
            console.error(error)
            toast.error("Failed to load services. Has supabase/sql/business-restructure.sql been run?")
        } else {
            setServices(data ?? [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchServices()
    }, [])

    const openCreate = () => {
        setDraft(EMPTY_DRAFT)
        setDialogOpen(true)
    }

    const openEdit = (service: Service) => {
        setDraft({ ...service })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!draft.title.trim()) {
            toast.error("Title is required")
            return
        }
        setIsSaving(true)
        const payload = {
            title: draft.title.trim(),
            problem: draft.problem.trim(),
            solution: draft.solution.trim(),
            outcome: draft.outcome.trim(),
            image_url: draft.image_url || null,
            is_active: draft.is_active,
            updated_at: new Date().toISOString(),
        }

        const { error } = draft.id
            ? await supabase.from("services").update(payload).eq("id", draft.id)
            : await supabase.from("services").insert([{
                ...payload,
                display_order: services.length ? Math.max(...services.map((s) => s.display_order)) + 1 : 0,
            }])

        setIsSaving(false)
        if (error) {
            console.error(error)
            toast.error("Failed to save service: " + error.message)
            return
        }
        toast.success(draft.id ? "Service updated" : "Service created")
        setDialogOpen(false)
        fetchServices()
    }

    const handleDelete = async () => {
        if (!pendingDeleteId) return
        const { error } = await supabase.from("services").delete().eq("id", pendingDeleteId)
        setPendingDeleteId(null)
        if (error) {
            toast.error("Failed to delete service")
            return
        }
        toast.success("Service deleted")
        fetchServices()
    }

    // Swap display_order with the neighbour in the given direction.
    const move = async (index: number, direction: -1 | 1) => {
        const a = services[index]
        const b = services[index + direction]
        if (!a || !b) return
        const [r1, r2] = await Promise.all([
            supabase.from("services").update({ display_order: b.display_order }).eq("id", a.id),
            supabase.from("services").update({ display_order: a.display_order }).eq("id", b.id),
        ])
        if (r1.error || r2.error) toast.error("Failed to reorder")
        fetchServices()
    }

    return (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Services</h1>
                    <p className="text-sm text-muted-foreground">
                        The problems you solve for businesses. Shown in chat as problem, solution and outcome, in this order.
                    </p>
                </div>
                <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
            </div>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : services.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        No services yet. Add the first problem you solve.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {services.map((service, i) => (
                        <Card key={service.id} className={service.is_active ? "" : "opacity-60"}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-base">
                                        {service.title}
                                        {!service.is_active && <span className="ml-2 text-xs font-normal text-muted-foreground">(hidden)</span>}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">{service.problem}</CardDescription>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === services.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(service)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => setPendingDeleteId(service.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{draft.id ? "Edit Service" : "New Service"}</DialogTitle>
                        <DialogDescription>Write it from the client&apos;s side. What hurts, what you do, what changes.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="svc-title">Title</Label>
                            <Input id="svc-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Workflow automation" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="svc-problem">The problem</Label>
                            <Textarea id="svc-problem" value={draft.problem} onChange={(e) => setDraft({ ...draft, problem: e.target.value })} placeholder="e.g. Your team copies data between tools by hand and mistakes slip through." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="svc-solution">What I do</Label>
                            <Textarea id="svc-solution" value={draft.solution} onChange={(e) => setDraft({ ...draft, solution: e.target.value })} placeholder="e.g. I connect your tools and automate the hand-offs, with alerts when something needs a human." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="svc-outcome">The outcome</Label>
                            <Textarea id="svc-outcome" value={draft.outcome} onChange={(e) => setDraft({ ...draft, outcome: e.target.value })} placeholder="e.g. Hours back every week, fewer errors, faster turnaround for customers." />
                        </div>
                        <ImageUploader
                            label="Image (optional)"
                            folder="services"
                            value={draft.image_url ?? ""}
                            onChange={(url) => setDraft({ ...draft, image_url: url || null })}
                            aspectRatio="16/9"
                        />
                        <div className="flex items-center gap-3">
                            <Switch id="svc-active" checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
                            <Label htmlFor="svc-active">Visible on the site</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Service
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!pendingDeleteId}
                onOpenChange={(open) => !open && setPendingDeleteId(null)}
                title="Delete this service?"
                onConfirm={handleDelete}
            />
        </div>
    )
}
