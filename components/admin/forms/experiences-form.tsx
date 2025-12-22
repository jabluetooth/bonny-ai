"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Pencil, Trash2, Briefcase, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import { ExperienceDialog } from "./experience-dialog"

export function AdminExperiencesForm() {
    const [isLoading, setIsLoading] = useState(true)
    const [experiences, setExperiences] = useState<any[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedExp, setSelectedExp] = useState<any>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchExperiences = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('experiences')
            .select('*')
            .order('date', { ascending: false }) // Ideal would be true date sort, but text date is tricky. 

        if (error) {
            console.error(error)
            // toast.error("Failed to fetch experiences") // Suppress initially if table empty/missing
        } else {
            setExperiences(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchExperiences()
    }, [])

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this experience?")) return

        const { error } = await supabase.from('experiences').delete().eq('id', id)
        if (error) {
            toast.error("Failed to delete experience")
        } else {
            toast.success("Experience deleted")
            fetchExperiences()
        }
    }

    const handleEdit = (exp: any) => {
        setSelectedExp(exp)
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setSelectedExp(null)
        setIsDialogOpen(true)
    }

    if (isLoading) {
        return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    const work = experiences.filter(e => e.category === 'work')
    const education = experiences.filter(e => e.category === 'education')

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Experience</h2>
                    <p className="text-muted-foreground">Manage work history and education.</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Experience
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                {/* Work Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" /> Work Experience
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {work.length === 0 && <p className="text-muted-foreground text-sm">No work experience added.</p>}
                        {work.map(exp => (
                            <div key={exp.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div>
                                    <h3 className="font-semibold">{exp.role}</h3>
                                    <p className="text-sm text-muted-foreground">{exp.company} • {exp.date}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{exp.location}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(exp.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Education Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" /> Education
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {education.length === 0 && <p className="text-muted-foreground text-sm">No education added.</p>}
                        {education.map(exp => (
                            <div key={exp.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div>
                                    <h3 className="font-semibold">{exp.role}</h3>
                                    <p className="text-sm text-muted-foreground">{exp.company} • {exp.date}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(exp.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <ExperienceDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                experience={selectedExp}
                onSuccess={() => { setIsDialogOpen(false); fetchExperiences(); }}
            />
        </div>
    )
}
