"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, Github } from "lucide-react";
import { ProjectDetails, type Project } from "@/components/ui/expandable-card";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { TagList } from "@/components/page/page-parts";
import { cn } from "@/lib/utils";

export type CaseStudy = Project & { type?: string };

const ALL = "All";

/** Filterable grid of case studies; each card opens the project detail modal. */
export function CaseStudyGrid({ projects }: { projects: CaseStudy[] }) {
    const [filter, setFilter] = useState(ALL);
    const [active, setActive] = useState<CaseStudy | null>(null);
    const [mounted, setMounted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const id = useId();

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!active) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, [active]);

    useOutsideClick(ref, () => setActive(null));

    const filters = useMemo(() => {
        const counts = new Map<string, number>();
        for (const p of projects) {
            const t = p.type || "Other";
            counts.set(t, (counts.get(t) || 0) + 1);
        }
        return [[ALL, projects.length] as const, ...[...counts.entries()].sort((a, b) => b[1] - a[1])];
    }, [projects]);

    const shown = filter === ALL ? projects : projects.filter((p) => (p.type || "Other") === filter);

    return (
        <>
            {mounted && createPortal(
                <AnimatePresence mode="wait">
                    {active && <ProjectDetails active={active} id={id} onClose={() => setActive(null)} refProp={ref} />}
                </AnimatePresence>,
                document.body
            )}

            <div role="group" aria-label="Filter case studies" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {filters.map(([name, count]) => (
                    <button
                        key={name}
                        type="button"
                        aria-pressed={filter === name}
                        onClick={() => setFilter(name)}
                        className={cn(
                            "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                            filter === name
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        )}
                    >
                        {name}
                        <span className={cn("text-xs tabular-nums", filter === name ? "opacity-70" : "text-muted-foreground/70")}>{count}</span>
                    </button>
                ))}
            </div>

            <ul className="grid gap-5 sm:grid-cols-2">
                {shown.map((p) => (
                    <li key={p.title}>
                        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                            <button
                                type="button"
                                onClick={() => setActive(p)}
                                aria-label={`Open ${p.title} details`}
                                className="relative block aspect-[16/9] w-full overflow-hidden bg-muted"
                            >
                                {p.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, arbitrary host
                                    <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                                ) : (
                                    <span className="flex h-full items-center justify-center text-3xl font-bold text-muted-foreground/40">{p.title.slice(0, 2)}</span>
                                )}
                            </button>

                            <div className="flex flex-1 flex-col gap-3 p-5">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {p.type && <span className="font-semibold uppercase tracking-wider">{p.type}</span>}
                                    {p.industry && <span>· {p.industry}</span>}
                                    {p.status && (
                                        <span className="ml-auto inline-flex items-center gap-1.5">
                                            <span className={cn("h-1.5 w-1.5 rounded-full", p.status === "Online" ? "bg-emerald-500" : "bg-amber-500")} />
                                            {p.status === "Online" ? "Live" : p.status}
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-lg font-semibold leading-snug tracking-tight">{p.title}</h2>

                                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                    {p.problem || p.description}
                                </p>

                                {p.results && p.results.length > 0 && (
                                    <ul aria-label="Results" className="flex flex-wrap gap-1.5">
                                        {p.results.slice(0, 3).map((r) => (
                                            <li key={r} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">{r}</li>
                                        ))}
                                    </ul>
                                )}

                                <TagList tags={p.tech_stack || []} label="Tech stack" max={4} className="mt-auto pt-1" />

                                <div className="flex items-center gap-2 border-t border-border pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setActive(p)}
                                        className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:underline underline-offset-4"
                                    >
                                        View case study
                                    </button>
                                    <span className="ml-auto flex items-center gap-1">
                                        {p.github_url && (
                                            <a href={p.github_url} target="_blank" rel="noopener noreferrer" aria-label={`${p.title} source code on GitHub`} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                                <Github size={16} />
                                            </a>
                                        )}
                                        {p.project_url && (
                                            <a href={p.project_url} target="_blank" rel="noopener noreferrer" aria-label={`${p.title} live site`} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                                <ArrowUpRight size={16} />
                                            </a>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </article>
                    </li>
                ))}
            </ul>
        </>
    );
}
