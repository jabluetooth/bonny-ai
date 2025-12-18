"use strict";
import React, { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Github, ExternalLink, X } from "lucide-react";

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

// Sub-component for the Expanded View (Portal)
const ProjectDetails = ({
    active,
    id,
    onClose,
    refProp
}: {
    active: Project;
    id: string;
    onClose: () => void;
    refProp: React.RefObject<HTMLDivElement | null>;
}) => {
    return (
        <>
            <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 h-full w-full z-[999]"
                style={{ backdropFilter: "blur(10px)" }}
                onClick={onClose}
            />
            <div className="fixed inset-0 grid place-items-center z-[1000] pointer-events-none">
                <motion.div
                    key={`card-${active.title}-${id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    ref={refProp}
                    className="w-full max-w-2xl h-full md:h-fit md:max-h-[85vh] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
                >
                    {/* Close Button */}
                    <motion.button
                        key={`button-close-${active.title}-${id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-4 right-4 bg-white/50 dark:bg-black/50 p-2 rounded-full z-10 backdrop-blur-sm"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                    </motion.button>

                    {/* Image Section */}
                    <div
                        className="w-full h-80 lg:h-96 sm:rounded-tr-lg sm:rounded-tl-lg overflow-hidden"
                    >
                        <img
                            width={600}
                            height={400}
                            src={active.image_url || "/placeholder.png"}
                            alt={active.title}
                            className="w-full h-full object-cover object-top"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-neutral-700 dark:text-neutral-200 text-xl">
                                {active.title}
                            </h3>

                            {/* Checkout Button */}
                            {active.project_url && (
                                <a
                                    href={active.project_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors flex items-center gap-2 dark:bg-zinc-800 dark:text-white dark:hover:bg-white dark:hover:text-zinc-900"
                                >
                                    Checkout
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>

                        <div className="pt-2 relative px-2">
                            <div className="text-neutral-600 text-sm md:text-base lg:text-base h-full md:h-fit pb-1 dark:text-neutral-400 flex flex-col gap-6">
                                <p>{active.description}</p>

                                {/* Links */}
                                {active.github_url && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={active.github_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                                                <Github className="w-4 h-4" />
                                                GitHub Repo
                                            </a>
                                        </Button>
                                    </div>
                                )}

                                <Separator />

                                {/* Tech Stack */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tech Stack</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {active.tech_stack?.map((tech) => (
                                            <span
                                                key={tech}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-medium rounded-xl border whitespace-normal h-auto text-left max-w-full leading-snug break-words",
                                                    "bg-zinc-900 text-white border-zinc-800 dark:bg-white dark:text-zinc-900"
                                                )}
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Features</h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {active.features?.map((feature, i) => (
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
                                        {active.challenges}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div >
        </>
    );
};

// Sub-component for the List Item
const ProjectListItem = ({
    project,
    id,
    onSelect
}: {
    project: Project;
    id: string;
    onSelect: () => void;
}) => {
    return (
        <div
            key={`card-${project.title}-${id}`}
            onClick={onSelect}
            className="py-4 pl-4 pr-4 flex flex-row justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl cursor-pointer transition-colors group"
        >
            <div className="flex gap-4 flex-row items-center">
                {/* Image */}
                <div className="rounded-lg overflow-hidden h-14 w-14">
                    <img
                        width={60}
                        height={60}
                        src={project.image_url || "/placeholder.png"}
                        alt={project.title}
                        className="h-full w-full object-cover object-top"
                    />
                </div>
                <div className="">
                    <h3 className="font-medium text-neutral-800 dark:text-neutral-200 text-base">
                        {project.title}
                    </h3>
                    <div className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                        <div className="flex flex-wrap gap-1">
                            {project.tech_stack?.slice(0, 3).map((tech, i) => (
                                <span key={tech} className="text-xs">
                                    {tech}{i < (project.tech_stack?.slice(0, 3).length || 0) - 1 ? " • " : ""}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <button
                className="ml-auto px-4 py-2 text-sm rounded-full font-bold bg-gray-100 text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors dark:bg-zinc-800 dark:text-white dark:hover:bg-white dark:hover:text-zinc-900"
                onClick={(e) => {
                    e.stopPropagation();
                    if (project.project_url) {
                        window.open(project.project_url, '_blank', 'noopener,noreferrer');
                    }
                }}
            >
                Checkout
            </button>
        </div>
    );
};

export function ExpandableCardDemo({ projects }: { projects: Project[] }) {
    const [active, setActive] = useState<(typeof projects)[number] | boolean | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const id = useId();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setActive(false);
            }
        }

        if (active && typeof active === "object") {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [active]);

    useOutsideClick(ref, () => setActive(null));

    return (
        <>
            {mounted && createPortal(
                <AnimatePresence mode="wait">
                    {active && typeof active === "object" && (
                        <ProjectDetails
                            active={active}
                            id={id}
                            onClose={() => setActive(null)}
                            refProp={ref}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}

            <ul className="max-w-6xl mx-auto w-full gap-4 flex flex-col">
                {projects.map((project, index) => (
                    <ProjectListItem
                        key={`${project.title}-${index}`}
                        project={project}
                        id={id}
                        onSelect={() => setActive(project)}
                    />
                ))}
            </ul>
        </>
    );
}
