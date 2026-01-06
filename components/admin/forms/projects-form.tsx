"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { ProjectDialog } from "./project-edit-dialog"

export function AdminProjectsForm() {
    const [isLoading, setIsLoading] = useState(true)
    const [projects, setProjects] = useState<any[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<any>(null)

    const fetchProjects = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                project_skills (
                    skills (
                        name
                    )
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            toast.error("Failed to fetch projects")
        } else {
            console.log("Fetched Projects:", data); // Debug

            // Map the nested skill objects to flat array for easier UI handling
            const mapped = data?.map(p => ({
                ...p,
                tech_stack: p.project_skills ? p.project_skills.map((ps: any) => ps.skills?.name).filter(Boolean) : []
            })) || []

            setProjects(mapped)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return

        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (error) {
            toast.error("Failed to delete project")
        } else {
            toast.success("Project deleted")
            fetchProjects()
        }
    }

    const handleEdit = (project: any) => {
        setSelectedProject(project)
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setSelectedProject(null)
        setIsDialogOpen(true)
    }

    const handleDialogClose = (shouldRefresh = false) => {
        setIsDialogOpen(false)
        setSelectedProject(null)
        if (shouldRefresh) {
            fetchProjects()
        }
    }

    if (isLoading) {
        return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">Manage your portfolio projects.</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Project
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Projects</CardTitle>
                    <CardDescription>
                        A list of all projects visible on your portfolio.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <p>No projects found. Add one to get started!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="hidden md:table-cell">Tech Stack</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">{project.title}</TableCell>
                                        <TableCell>{project.type}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {project.tech_stack?.slice(0, 3).map((tech: string) => (
                                                    <span key={tech} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {project.tech_stack?.length > 3 && (
                                                    <span className="text-xs text-muted-foreground">+{project.tech_stack.length - 3} more</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {project.live_url && (
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ProjectDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                project={selectedProject}
                onSuccess={() => handleDialogClose(true)}
            />
        </div>
    )
}
