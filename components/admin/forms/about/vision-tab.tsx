"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"

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
    const [formData, setFormData] = useState<Partial<VisionCard>>({})

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        const { error } = await supabase.from('vision_cards').delete().eq('id', id)
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
                                <TableCell className="truncate max-w-[150px]">{item.image_url || "-"}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No items found</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Vision Card" : "New Vision Card"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
                        <div className="grid gap-2">
                            <Label>Image URL (Optional)</Label>
                            <Input value={formData.image_url || ""} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
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
