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
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader } from "@/components/admin/image-uploader"

interface Interest {
    id: string
    title: string
    description: string
    image_url: string
    display_order: number
}

export function InterestsTab() {
    const [items, setItems] = useState<Interest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Interest | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState<Partial<Interest>>({})

    useEffect(() => {
        fetchItems()
    }, [])

    async function fetchItems() {
        setIsLoading(true)
        const { data } = await supabase.from('interests').select('*').order('display_order', { ascending: true })
        if (data) setItems(data)
        setIsLoading(false)
    }

    const openCreateDialog = () => {
        setEditingItem(null)
        setFormData({ title: "", description: "", image_url: "", display_order: items.length + 1 })
        setIsDialogOpen(true)
    }

    const openEditDialog = (item: Interest) => {
        setEditingItem(item)
        setFormData(item)
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            if (editingItem) {
                const { error } = await supabase.from('interests').update(formData).eq('id', editingItem.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('interests').insert([formData])
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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        const { error } = await supabase.from('interests').delete().eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success("Deleted")
            fetchItems()
        }
    }

    if (isLoading) return <Loader2 className="animate-spin mx-auto" />

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Interests</CardTitle>
                    <CardDescription>Hobbies and personal interests.</CardDescription>
                </div>
                <Button size="sm" onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" /> Add Interest</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell>{item.display_order}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No items found</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Interest" : "New Interest"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-3">
                        <div className="grid gap-1.5">
                            <Label className="text-sm">Title</Label>
                            <Input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} className="h-8" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-sm">Description</Label>
                            <Textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} className="min-h-[80px]" />
                        </div>
                        <ImageUploader
                            label="Image"
                            folder="interests"
                            value={formData.image_url || ""}
                            onChange={(url) => setFormData({ ...formData, image_url: url })}
                            aspectRatio="4/3"
                        />
                        <div className="grid gap-1.5">
                            <Label className="text-sm">Display Order</Label>
                            <Input type="number" value={formData.display_order || 0} onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) })} className="h-8" />
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
