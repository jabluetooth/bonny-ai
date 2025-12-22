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

interface ProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project?: any
    onSuccess: () => void
}

export function ProjectDialog({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState("Web Development")
    const [imageUrl, setImageUrl] = useState("")
    const [githubUrl, setGithubUrl] = useState("")
    const [liveUrl, setLiveUrl] = useState("")
    const [challenges, setChallenges] = useState("")
    const [features, setFeatures] = useState<string[]>([])
    const [techStack, setTechStack] = useState<string[]>([]) // For now, just a list of strings
    const [newFeature, setNewFeature] = useState("")
    const [newTech, setNewTech] = useState("")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (project) {
            setTitle(project.title || "")
            setDescription(project.description || "")
            setType(project.type || "Web Development")
            setImageUrl(project.image_url || "")
            setGithubUrl(project.github_url || "")
            setLiveUrl(project.live_url || "")
            setChallenges(project.challenges_learned || "")
            setFeatures(project.key_features || [])
            setTechStack(project.tech_stack || [])
        } else {
            // Reset form
            setTitle("")
            setDescription("")
            setType("Web Development")
            setImageUrl("")
            setGithubUrl("")
            setLiveUrl("")
            setChallenges("")
            setFeatures([])
            setTechStack([])
        }
    }, [project, open])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const payload = {
                title,
                description,
                type,
                image_url: imageUrl,
                github_url: githubUrl,
                live_url: liveUrl,
                challenges_learned: challenges,
                key_features: features,
                updated_at: new Date().toISOString()
            }

            let projectId = project?.id

            if (projectId) {
                const { error } = await supabase.from('projects').update(payload).eq('id', projectId)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from('projects').insert([payload]).select().single()
                if (error) throw error
                projectId = data.id
            }

            // Handle Tech Stack (Skills)
            // 1. Ensure skills exist
            // 2. Link them in project_skills

            // For simplicity in this iteration, we might assume skills strictly map to names.
            // A robust implementation would fetch IDs.
            // Let's implement a "best effort" link:

            if (projectId && techStack.length > 0) {
                // First delete existing links if editing
                if (project) {
                    await supabase.from('project_skills').delete().eq('project_id', projectId)
                }

                for (const tech of techStack) {
                    // Find or Create Skill
                    let skillId;
                    const { data: existing } = await supabase.from('skills').select('id').ilike('name', tech).maybeSingle()

                    if (existing) {
                        skillId = existing.id
                    } else {
                        const { data: newSkill } = await supabase.from('skills').insert({ name: tech }).select().single()
                        if (newSkill) skillId = newSkill.id
                    }

                    if (skillId) {
                        await supabase.from('project_skills').insert({
                            project_id: projectId,
                            skill_id: skillId
                        })
                    }
                }
            } else if (projectId && project) {
                // If tech stack cleared
                await supabase.from('project_skills').delete().eq('project_id', projectId)
            }


            toast.success(project ? "Project updated" : "Project created")
            onSuccess()
        } catch (error: any) {
            console.error(error)
            toast.error("Error saving project: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const addFeature = () => {
        if (newFeature.trim()) {
            setFeatures([...features, newFeature.trim()])
            setNewFeature("")
        }
    }

    const removeFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index))
    }

    const addTech = () => {
        if (newTech.trim()) {
            setTechStack([...techStack, newTech.trim()])
            setNewTech("")
        }
    }

    const removeTech = (index: number) => {
        setTechStack(techStack.filter((_, i) => i !== index))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{project ? "Edit Project" : "Add New Project"}</DialogTitle>
                    <DialogDescription>
                        Fill in the details for your portfolio project.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Project Title</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Chatbot" />
                        </div>
                        <div className="space-y-2">
                            <Label>Type / Category</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Web Development">Web Development</SelectItem>
                                    <SelectItem value="AI & ML">AI & ML</SelectItem>
                                    <SelectItem value="Mobile App">Mobile App</SelectItem>
                                    <SelectItem value="Data Science">Data Science</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Short Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief summary..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Live URL</Label>
                            <Input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                            <Label>GitHub URL</Label>
                            <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Header Image URL</Label>
                        <div className="flex gap-2">
                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                            {imageUrl && <img src={imageUrl} alt="Preview" className="h-10 w-10 rounded object-cover border" />}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tech Stack / Skills (Press Enter or Add)</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newTech}
                                onChange={(e) => setNewTech(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                                placeholder="e.g. React, Python..."
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

                    <div className="space-y-2">
                        <Label>Key Features (Press Enter or Add)</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                                placeholder="e.g. Real-time sync"
                            />
                            <Button type="button" onClick={addFeature} variant="secondary" size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            {features.map((feature, i) => (
                                <li key={i} className="text-sm group flex items-center justify-between">
                                    <span>{feature}</span>
                                    <button onClick={() => removeFeature(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500">
                                        <X className="h-3 w-3" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <Label>Challenges & Learnings</Label>
                        <Textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} placeholder="What was difficult? What did you learn?" />
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
