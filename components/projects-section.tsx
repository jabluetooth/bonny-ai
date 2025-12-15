"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { Separator } from "@/components/ui/separator";
import { Loader2, Github, ExternalLink } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
    title: string;
    image_url?: string;
    description?: string;
    github_url?: string;
    project_url?: string;
    features: string[];
    tech_stack: string[];
    challenges: string;
}

interface ProjectsSectionProps {
    category?: string;
}

export function ProjectsSection({ category }: ProjectsSectionProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [api, setApi] = useState<any>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        async function fetchProjects() {
            try {
                const url = category
                    ? `/api/projects?category=${encodeURIComponent(category)}`
                    : '/api/projects';

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                }
            } catch (error) {
                console.error("Failed to load projects", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProjects();
    }, [category]);

    useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-full min-w-0 flex flex-col gap-4 p-4 rounded-xl animate-in fade-in">
                <Skeleton className="h-7 w-48 mb-2 px-2" />

                {/* Carousel Area Match */}
                <div className="w-full max-w-5xl mx-auto relative px-4 md:px-12">
                    {/* Simulate 3 visible cards for "center" alignment feel? Or just one big block? 
                         Real carousel shows partial next/prev. 
                         Let's show 3 cols to mimic carousel items 
                     */}
                    <div className="flex gap-4 overflow-hidden h-64 items-center justify-center">
                        <Skeleton className="h-64 w-[15%] hidden lg:block rounded-xl opacity-40 shrink-0" />
                        <Skeleton className="h-64 w-[70%] md:w-[60%] lg:w-[45%] rounded-xl shrink-0 shadow-md" />
                        <Skeleton className="h-64 w-[15%] hidden lg:block rounded-xl opacity-40 shrink-0" />
                    </div>
                </div>

                <div className="flex justify-center gap-2 mt-2">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-2 w-2 rounded-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (projects.length === 0) {
        return null; // Don't render if no projects found
    }

    return (
        <>
            <div className="w-full max-w-full min-w-0 flex flex-col gap-4 p-4 rounded-xl border border-border/40 bg-card/50 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <h2 className="text-xl font-semibold px-2">Featured Projects</h2>

                <Carousel
                    setApi={setApi}
                    opts={{
                        align: "center",
                        loop: true,
                    }}
                    className="w-full max-w-5xl mx-auto relative"
                >
                    {/* Progressive Blur Overlays */}
                    <ProgressiveBlur direction="left" className="w-16 md:w-24 z-10" />
                    <ProgressiveBlur direction="right" className="w-16 md:w-24 z-10" />

                    <CarouselContent className="-ml-[10px] py-4">
                        {projects.map((project, index) => (
                            <CarouselItem key={index} className="pl-[10px] basis-[70%] md:basis-[60%] lg:basis-[45%]">
                                <div className="h-full py-2">
                                    <Card
                                        className="relative h-64 overflow-hidden border-0 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group rounded-xl shadow-md"
                                        onClick={() => handleProjectClick(project)}
                                    >
                                        {/* Background Image */}
                                        {project.image_url ? (
                                            <img
                                                src={project.image_url}
                                                alt={project.title}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
                                                No Image
                                            </div>
                                        )}

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 transition-opacity duration-300" />

                                        {/* Content Overlay */}
                                        <div className="relative h-full flex flex-col justify-between p-5 text-white">
                                            {/* Top: Title */}
                                            <div className="pt-1">
                                                <h3 className="text-xl font-bold leading-tight drop-shadow-md">
                                                    {project.title}
                                                </h3>
                                            </div>

                                            {/* Bottom: Description */}
                                            <div>
                                                <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed opacity-90 drop-shadow-sm">
                                                    {project.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-4 lg:-left-12 hidden md:flex z-20" />
                    <CarouselNext className="-right-4 lg:-right-12 hidden md:flex z-20" />
                </Carousel>

                {/* Dots Navigation */}
                <div className="flex justify-center gap-2 mt-2">
                    {Array.from({ length: count }).map((_, index) => (
                        <button
                            key={index}
                            className={`h-2 w-2 rounded-full transition-all duration-300 ${index + 1 === current ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                }`}
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div >

            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-4">
                            <DialogTitle className="text-2xl font-bold">{selectedProject?.title}</DialogTitle>
                        </div>
                        <DialogDescription className="text-base mt-2">
                            {selectedProject?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProject && (
                        <div className="flex flex-col gap-6 mt-4">
                            {/* Links */}
                            <div className="flex gap-4">
                                {selectedProject.github_url && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                                            <Github className="w-4 h-4" />
                                            GitHub Repo
                                        </a>
                                    </Button>
                                )}
                                {selectedProject.project_url && (
                                    <Button size="sm" asChild>
                                        <a href={selectedProject.project_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                                            Check it out
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>

                            <Separator />

                            {/* Tech Stack */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tech Stack</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProject.tech_stack?.map((tech) => (
                                        <Badge key={tech} variant="secondary">
                                            {tech}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Key Features */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Features</h4>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {selectedProject.features?.map((feature, i) => (
                                        <li key={i} className="text-sm flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                            <span className="leading-snug">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Challenges */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Challenges & Learning</h4>
                                <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed border border-border/50">
                                    {selectedProject.challenges}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="mt-4 sm:justify-start">
                        {/* Footer content if needed */}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
