"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader } from "@/components/admin/image-uploader"

interface BackgroundCard {
    id: string
    title: string
    description: string
    image: string
    date_range: string
    display_order: number
}

export function BackgroundTab() {
    const [cards, setCards] = useState<BackgroundCard[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCard, setEditingCard] = useState<BackgroundCard | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form State
    const [formData, setFormData] = useState<Partial<BackgroundCard>>({})

    useEffect(() => {
        fetchCards()
    }, [])

    async function fetchCards() {
        setIsLoading(true)
        const { data } = await supabase
            .from('background_cards')
            .select('*')
            .order('display_order', { ascending: true })

        if (data) setCards(data)
        setIsLoading(false)
    }

    const openCreateDialog = () => {
        setEditingCard(null)
        setFormData({ title: "", description: "", image: "", date_range: "", display_order: cards.length + 1 })
        setIsDialogOpen(true)
    }

    const openEditDialog = (card: BackgroundCard) => {
        setEditingCard(card)
        setFormData(card)
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            if (editingCard) {
                const { error } = await supabase
                    .from('background_cards')
                    .update(formData)
                    .eq('id', editingCard.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('background_cards')
                    .insert([formData])
                if (error) throw error
            }
            toast.success("Saved successfully")
            setIsDialogOpen(false)
            fetchCards()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        const { error } = await supabase.from('background_cards').delete().eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success("Deleted")
            fetchCards()
        }
    }

    if (isLoading) return <Loader2 className="animate-spin mx-auto" />

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Background Cards</CardTitle>
                    <CardDescription>Education, Work History, or Milestones.</CardDescription>
                </div>
                <Button size="sm" onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" /> Add Card</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cards.map((card) => (
                            <TableRow key={card.id}>
                                <TableCell className="font-medium">{card.title}</TableCell>
                                <TableCell>{card.date_range}</TableCell>
                                <TableCell>{card.display_order}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(card)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(card.id)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {cards.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No items found</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingCard ? "Edit Card" : "New Background Card"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 overflow-y-auto flex-1">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Date Range</Label>
                            <Input value={formData.date_range || ""} onChange={e => setFormData({ ...formData, date_range: e.target.value })} placeholder="2020 - Present" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <ImageUploader
                            label="Image"
                            folder="background"
                            value={formData.image || ""}
                            onChange={(url) => setFormData({ ...formData, image: url })}
                            aspectRatio="16/9"
                        />
                        <div className="grid gap-2">
                            <Label>Display Order</Label>
                            <Input type="number" value={formData.display_order || 0} onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
