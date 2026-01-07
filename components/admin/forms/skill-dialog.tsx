"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ImageUploader } from "@/components/admin/image-uploader"

interface SkillDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    skill?: any
    onSuccess: () => void
}

export function SkillDialog({ open, onOpenChange, skill, onSuccess }: SkillDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [iconUrl, setIconUrl] = useState("")
    const [isHighlight, setIsHighlight] = useState(false)
    const [categories, setCategories] = useState<any[]>([])

    // Fetch categories on mount/open
    useEffect(() => {
        async function fetchCats() {
            const { data } = await supabase.from('skill_categories').select('*').order('sort_order')
            if (data) setCategories(data)
        }
        if (open) fetchCats()
    }, [open])

    useEffect(() => {
        if (skill) {
            setName(skill.name || "")
            setCategoryId(skill.category_id || "") // Ensure we use the ID now
            setIconUrl(skill.icon_url || "")
            setIsHighlight(skill.is_highlight || false)
        } else {
            setName("")
            setCategoryId("") // Reset
            setIconUrl("")
            setIsHighlight(false)
        }
    }, [skill, open])

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Skill name is required")
            return
        }
        if (!categoryId) {
            toast.error("Category is required")
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                name,
                category_id: categoryId, // Save ID
                icon_url: iconUrl,
                is_highlight: isHighlight
            }

            if (skill?.id) {
                const { error } = await supabase.from('skills').update(payload).eq('id', skill.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('skills').insert([payload])
                if (error) throw error
            }

            toast.success(skill ? "Skill updated" : "Skill created")
            onSuccess()
        } catch (error: any) {
            console.error(error)
            toast.error("Error saving skill: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{skill ? "Edit Skill" : "Add New Skill"}</DialogTitle>
                    <DialogDescription>
                        Manage your technical skills and expertise.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Skill Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. React" />
                    </div>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <ImageUploader
                        label="Icon (Optional)"
                        folder="skills"
                        value={iconUrl}
                        onChange={setIconUrl}
                        aspectRatio="1/1"
                        maxSizeMB={2}
                    />

                    <div className="flex items-center justify-between border p-3 rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Highlight</Label>
                            <p className="text-xs text-muted-foreground">
                                Show in the scrolling marquee?
                            </p>
                        </div>
                        <Switch
                            checked={isHighlight}
                            onCheckedChange={setIsHighlight}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
