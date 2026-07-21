"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Pencil, Trash2, Star } from "lucide-react"
import { toast } from "sonner"
import { SkillDialog } from "./skill-dialog"
import { Badge } from "@/components/ui/badge"

export function AdminSkillsForm() {
    const [isLoading, setIsLoading] = useState(true)
    const [categories, setCategories] = useState<any[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedSkill, setSelectedSkill] = useState<any>(null)

    const fetchSkills = async () => {
        setIsLoading(true)
        // Fetch Categories WITH Skills nested (Relational query matches backend.md structure)
        const { data, error } = await supabase
            .from('skill_categories')
            .select(`
                *,
                skills (*)
            `)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error(error)
            toast.error("Failed to fetch skills")
        } else {
            // Sort nested skills by name manually or via code if needed
            const sorted = data?.map((cat: any) => ({
                ...cat,
                skills: cat.skills?.sort((a: any, b: any) => a.name.localeCompare(b.name)) || []
            })) || []
            setCategories(sorted)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchSkills()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this skill?")) return

        const { error } = await supabase.from('skills').delete().eq('id', id)
        if (error) {
            toast.error("Failed to delete skill")
        } else {
            toast.success("Skill deleted")
            fetchSkills()
        }
    }

    const handleEdit = (skill: any) => {
        setSelectedSkill(skill)
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setSelectedSkill(null)
        setIsDialogOpen(true)
    }

    if (isLoading) {
        return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Skills & Tools</h2>
                    <p className="text-muted-foreground">Manage your technical expertise and highlights.</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Skill
                </Button>
            </div>

            {categories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <p>No categories found. Run the SQL script!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {categories.map((cat) => (
                        <Card key={cat.id}>
                            <CardHeader className="py-4">
                                <CardTitle className="text-lg font-medium">{cat.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {cat.skills.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No skills in this category.</p>}
                                {cat.skills.map((skill: any) => (
                                    <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            {skill.icon_url ? (
                                                <img src={skill.icon_url} alt={skill.name} className="h-8 w-8 object-contain" />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                    {skill.name.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-medium flex items-center gap-2">
                                                    {skill.name}
                                                    {skill.is_highlight && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(skill)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(skill.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <SkillDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                skill={selectedSkill}
                onSuccess={() => { setIsDialogOpen(false); fetchSkills(); }}
            />
        </div>
    )
}
