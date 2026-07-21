"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { ImageUploader } from "@/components/admin/image-uploader"

interface VisionCard {
    id: string
    quote: string
    name: string
    title: string
    image_url?: string
}

export function VisionTab() {
    const [items, setItems] = useState<VisionCard[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<VisionCard | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
    const [formData, setFormData] = useState<Partial<VisionCard>>({})

    useEffect(() => {
        fetchItems()
    }, [])

    async function fetchItems() {
        setIsLoading(true)
        const { data } = await supabase.from('vision_cards').select('*').order('created_at', { ascending: false })
        if (data) setItems(data)
        setIsLoading(false)
    }

    const openCreateDialog = () => {
        setEditingItem(null)
        setFormData({ quote: "", name: "", title: "", image_url: "" })
        setIsDialogOpen(true)
    }

    const openEditDialog = (item: VisionCard) => {
        setEditingItem(item)
        setFormData(item)
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            if (editingItem) {
                const { error } = await supabase.from('vision_cards').update(formData).eq('id', editingItem.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('vision_cards').insert([formData])
                if (error) throw error
            }
            toast.success("Saved successfully")
            setIsDialogOpen(false)
            fetchItems()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteClick = (id: string) => {
        setPendingDeleteId(id)
        setConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!pendingDeleteId) return
        const { error } = await supabase.from('vision_cards').delete().eq('id', pendingDeleteId)
        if (error) toast.error(error.message)
        else {
            toast.success("Deleted")
            fetchItems()
        }
        setPendingDeleteId(null)
    }

    if (isLoading) return <Loader2 className="animate-spin mx-auto" />

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Vision Cards</CardTitle>
                    <CardDescription>Testimonials or Vision Statements.</CardDescription>
                </div>
                <Button size="sm" onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" /> Add Card</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Quote</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium truncate max-w-[200px]">{item.quote}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>
                                    {item.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No items found</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={handleConfirmDelete}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Vision Card" : "New Vision Card"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 overflow-y-auto flex-1">
                        <div className="grid gap-2">
                            <Label>Quote</Label>
                            <Input value={formData.quote || ""} onChange={e => setFormData({ ...formData, quote: e.target.value })} placeholder="Quote..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Author Name</Label>
                                <Input value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Author Title</Label>
                                <Input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="CEO, Tech Inc." />
                            </div>
                        </div>
                        <ImageUploader
                            label="Author Image (Optional)"
                            folder="vision"
                            value={formData.image_url || ""}
                            onChange={(url) => setFormData({ ...formData, image_url: url })}
                            aspectRatio="1/1"
                        />
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
