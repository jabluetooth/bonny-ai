"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, X } from "lucide-react"

interface ExperienceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    experience?: any
    onSuccess: () => void
}

export function ExperienceDialog({ open, onOpenChange, experience, onSuccess }: ExperienceDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [category, setCategory] = useState("work")
    const [company, setCompany] = useState("")
    const [role, setRole] = useState("")
    const [date, setDate] = useState("")
    const [location, setLocation] = useState("")
    const [type, setType] = useState("Full-time")
    const [description, setDescription] = useState<string[]>([])
    const [techStack, setTechStack] = useState<string[]>([])

    // Inputs for lists
    const [newDesc, setNewDesc] = useState("")
    const [newTech, setNewTech] = useState("")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (experience) {
            setCategory(experience.category || "work")
            setCompany(experience.company || "")
            setRole(experience.role || "")
            setDate(experience.date || "")
            setLocation(experience.location || "")
            setType(experience.type || "Full-time")
            setDescription(experience.description || [])
            setTechStack(experience.tech_stack || [])
        } else {
            setCategory("work")
            setCompany("")
            setRole("")
            setDate("")
            setLocation("")
            setType("Full-time")
            setDescription([])
            setTechStack([])
        }
    }, [experience, open])

    const handleSave = async () => {
        if (!company.trim() || !role.trim()) {
            toast.error("Company and Role are required")
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                category,
                company,
                role,
                date,
                location,
                type,
                description,
                tech_stack: techStack,
                updated_at: new Date().toISOString()
            }

            let expId = experience?.id

            if (expId) {
                const { error } = await supabase.from('experiences').update(payload).eq('id', expId)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from('experiences').insert([payload]).select().single()
                if (error) throw error
                expId = data.id
            }

            // Sync with skills table (Best Effort)
            // We use the same logic as projects: try to link if skill exists.
            if (expId && techStack.length > 0) {
                if (experience) {
                    await supabase.from('experience_skills').delete().eq('experience_id', expId)
                }

                for (const tech of techStack) {
                    let skillId;
                    const { data: existing } = await supabase.from('skills').select('id').ilike('name', tech).maybeSingle()

                    if (existing) {
                        skillId = existing.id
                    } else {
                        const { data: newSkill } = await supabase.from('skills').insert({ name: tech }).select().single()
                        if (newSkill) skillId = newSkill.id
                    }

                    if (skillId) {
                        await supabase.from('experience_skills').insert({
                            experience_id: expId,
                            skill_id: skillId
                        })
                    }
                }
            } else if (expId && experience) {
                await supabase.from('experience_skills').delete().eq('experience_id', expId)
            }

            toast.success(experience ? "Experience updated" : "Experience added")
            onSuccess()
        } catch (error: any) {
            console.error(error)
            toast.error("Error saving experience: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const addDesc = () => {
        if (newDesc.trim()) {
            setDescription([...description, newDesc.trim()])
            setNewDesc("")
        }
    }
    const removeDesc = (i: number) => setDescription(description.filter((_, idx) => idx !== i))

    const addTech = () => {
        if (newTech.trim()) {
            setTechStack([...techStack, newTech.trim()])
            setNewTech("")
        }
    }
    const removeTech = (i: number) => setTechStack(techStack.filter((_, idx) => idx !== i))


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{experience ? "Edit Experience" : "Add Experience"}</DialogTitle>
                    <DialogDescription>
                        Work history or education details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="work">Work</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Full-time, Contract, BS..." />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company / Institution</Label>
                            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company Name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Role / Degree</Label>
                            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Software Engineer" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Jan 2023 - Present" />
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Responsibilities / Description (Shift+Enter for paragraphs)</Label>
                        <div className="flex gap-2">
                            <Textarea
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="Add a bullet point or paragraph..."
                                className="min-h-[60px]"
                            />
                            <Button type="button" onClick={addDesc} variant="secondary" className="h-auto">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            {description.map((item, i) => (
                                <li key={i} className="text-sm group flex items-start justify-between gap-2">
                                    <span className="whitespace-pre-wrap">{item}</span>
                                    <button onClick={() => removeDesc(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 shrink-0">
                                        <X className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <Label>Tech Stack / Skills</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newTech}
                                onChange={(e) => setNewTech(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                                placeholder="e.g. React, TypeScript..."
                            />
                            <Button type="button" onClick={addTech} variant="secondary" size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {techStack.map((tech, i) => (
                                <div key={i} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                                    {tech}
                                    <button onClick={() => removeTech(i)} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Experience
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
