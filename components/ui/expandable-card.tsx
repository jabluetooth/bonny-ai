"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import { ProjectMedia } from "@/components/page/project-media";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Github, ExternalLink, X, ArrowRight } from "lucide-react";
import { openContact } from "@/components/contact-cta";

export interface Project {
    title: string;
    image_url?: string;
    description?: string;
    github_url?: string;
    project_url?: string;
    features: string[];
    tech_stack: string[];
    challenges: string;
    status?: string;
    industry?: string;
    problem?: string;
    solution?: string;
    results?: string[];
}

// Sub-component for the Expanded View (Portal)
export const ProjectDetails = ({
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
    const titleId = `${id}-dialog-title`;
    const closeRef = useRef<HTMLButtonElement>(null);

    // Accessible dialog: move focus in, keep Tab inside, give focus back on close.
    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        closeRef.current?.focus({ preventScroll: true });
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Tab" || !refProp.current) return;
            const focusable = refProp.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
        };
    }, [refProp]);

    return (
        <>
            <motion.div
                key="overlay"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 h-full w-full z-[999]"
                style={{ backdropFilter: "blur(6px)" }}
                onClick={onClose}
            />
            <div className="fixed inset-0 grid place-items-center z-[1000] pointer-events-none">
                <motion.div
                    key={`card-${active.title}-${id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    ref={refProp}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    className="w-full max-w-2xl h-full md:h-fit md:max-h-[85vh] flex flex-col bg-card sm:rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
                >
                    {/* Close Button */}
                    <motion.button
                        key={`button-close-${active.title}-${id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        ref={closeRef}
                        type="button"
                        aria-label="Close project details"
                        className="absolute top-4 right-4 bg-card/90 p-2.5 rounded-full z-10 shadow-sm border border-border/60 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                        onClick={onClose}
                    >
                        <X aria-hidden className="w-4 h-4 text-foreground" />
                    </motion.button>

                    {/* Image Section */}
                    <div
                        className="relative w-full h-56 sm:h-80 lg:h-96 shrink-0 sm:rounded-tr-lg sm:rounded-tl-lg overflow-hidden bg-muted"
                    >
                        {active.image_url ? (
                            <ProjectMedia
                                src={active.image_url}
                                alt={`Demo of ${active.title}`}
                                sizes="(min-width: 672px) 672px, 100vw"
                            />
                        ) : (
                            <span aria-hidden className="flex h-full items-center justify-center text-5xl font-bold text-muted-foreground">{active.title.slice(0, 2)}</span>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <h3 id={titleId} className="font-bold text-foreground text-xl text-balance">
                                    {active.title}
                                </h3>
                                {active.status && (
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit ${active.status === 'Online' ? 'bg-green-100 text-green-800' :
                                            active.status === 'Down' ? 'bg-red-100 text-red-800' :
                                                'bg-amber-100 text-amber-800'
                                        }`}>
                                        {active.status}
                                    </span>
                                )}
                            </div>

                            {/* Checkout Button */}
                            {active.project_url && (
                                <a
                                    href={active.project_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    Checkout
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>

                        <div className="pt-2 relative px-2">
                            <div className="text-foreground/80 text-sm md:text-base h-full md:h-fit pb-1 flex flex-col gap-6">
                                <p>{active.description}</p>

                                {/* Case study: only shown when filled in from the admin tool */}
                                {(active.problem || active.solution || (active.results && active.results.length > 0)) && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                            Case Study{active.industry ?` · ${active.industry}` : ""}
                                        </h4>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {active.problem && (
                                                <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-danger mb-1">The problem</p>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{active.problem}</p>
                                                </div>
                                            )}
                                            {active.solution && (
                                                <div className="p-4 rounded-lg border border-brand/20 bg-brand/5">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand mb-1">What I built</p>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{active.solution}</p>
                                                </div>
                                            )}
                                        </div>
                                        {active.results && active.results.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {active.results.map((r) => (
                                                    <span key={r} className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-success border border-emerald-500/20">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Links */}
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" className="gap-2 rounded-full" onClick={() => { onClose(); openContact(); }}>
                                        Discuss a similar project
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                    {active.github_url && (
                                        <Button variant="outline" size="sm" className="rounded-full" asChild>
                                            <a href={active.github_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                                                <Github className="w-4 h-4" />
                                                GitHub Repo
                                            </a>
                                        </Button>
                                    )}
                                </div>

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
                                                    "bg-zinc-900 text-white border-zinc-800"
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
                                                <span aria-hidden className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                <span className="leading-snug">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Challenges */}
                                {active.challenges && <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Challenges & Learning</h4>
                                    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed border border-border/50">
                                        {active.challenges}
                                    </div>
                                </div>}
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
    onSelect
}: {
    project: Project;
    onSelect: () => void;
}) => {
    const tech = project.tech_stack?.slice(0, 3) ?? [];
    return (
        <li className="flex flex-row items-center gap-2 rounded-xl transition-colors hover:bg-muted/60 focus-within:bg-muted/60">
            <button
                type="button"
                onClick={onSelect}
                aria-haspopup="dialog"
                className="relative flex min-w-0 flex-1 flex-row items-center gap-4 rounded-xl p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
                {/* Image - Hidden on mobile */}
                <span className="relative hidden md:block shrink-0 rounded-lg overflow-hidden h-14 w-14 bg-muted">
                    {project.image_url && (
                        <ProjectMedia src={project.image_url} sizes="56px" still />
                    )}
                </span>
                <span className="min-w-0">
                    <span className="block font-medium text-foreground text-base">
                        {project.title}
                        <span className="sr-only">, view details</span>
                    </span>
                    {tech.length > 0 && (
                        <span className="mt-1 block text-xs text-muted-foreground">{tech.join(" ·")}</span>
                    )}
                </span>
            </button>

            {project.project_url && (
                <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${project.title} (new tab)`}
                    className="mr-4 shrink-0 px-4 py-2 text-sm rounded-full font-bold bg-muted text-foreground hover:bg-foreground hover:text-background transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                    Checkout
                </a>
            )}
        </li>
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
            document.body.style.overflow = "";
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

            <ul className="max-w-6xl mx-auto w-full gap-2 flex flex-col">
                {projects.map((project, index) => (
                    <ProjectListItem
                        key={`${project.title}-${index}`}
                        project={project}
                        onSelect={() => setActive(project)}
                    />
                ))}
            </ul>
        </>
    );
}
