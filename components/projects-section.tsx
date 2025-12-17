"use strict";
"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpandableCardDemo } from "@/components/ui/expandable-card";

export interface Project {
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


    if (isLoading) {
        return (
            <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 flex flex-row gap-4 items-center border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (projects.length === 0) {
        return null;
    }

    return (
        <div className="w-full p-4">
            <h2 className="text-xl font-semibold px-2 mb-4 text-center md:text-left mx-auto max-w-6xl">Featured Projects</h2>
            <ExpandableCardDemo projects={projects} />
        </div>
    );
}
