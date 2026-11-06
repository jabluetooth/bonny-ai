"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { SectionHeading, slug } from "@/components/page/page-parts";
import { cn } from "@/lib/utils";

interface Category {
    title: string;
    skills: { name: string }[];
}

const ALL = "All";

/** Searchable, filterable skill list for the Skills page. */
export function SkillsExplorer({ categories }: { categories: Category[] }) {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState(ALL);

    const q = query.trim().toLowerCase();
    const visible = useMemo(
        () =>
            categories
                .filter((c) => filter === ALL || c.title === filter)
                .map((c) => ({ ...c, skills: q ? c.skills.filter((s) => s.name.toLowerCase().includes(q)) : c.skills }))
                .filter((c) => c.skills.length > 0),
        [categories, filter, q]
    );
    const total = visible.reduce((n, c) => n + c.skills.length, 0);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
                <label className="relative flex-1">
                    <span className="sr-only">Search skills</span>
                    <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search a tool or technology, e.g. n8n, React, Python"
                        className="h-11 w-full rounded-xl border border-transparent bg-muted/60 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-border focus:bg-background [&::-webkit-search-cancel-button]:hidden"
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <X size={14} />
                        </button>
                    )}
                </label>
                <p className="px-2 text-xs tabular-nums text-muted-foreground sm:w-28 sm:text-right" aria-live="polite">
                    {total} {total === 1 ? "skill" : "skills"}
                </p>
            </div>

            <div role="group" aria-label="Filter by category" className="-mx-1 -mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {[ALL, ...categories.map((c) => c.title)].map((name) => (
                    <button
                        key={name}
                        type="button"
                        aria-pressed={filter === name}
                        onClick={() => setFilter(name)}
                        className={cn(
                            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                            filter === name
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        )}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                    <p className="font-medium">No skills match &ldquo;{query}&rdquo;</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try a broader term, or ask Bonny-AI whether I&apos;ve worked with it.</p>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2">
                    {visible.map((c) => (
                        <section key={c.title} aria-labelledby={`${slug(c.title)}-heading`} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                            <SectionHeading id={`${slug(c.title)}-heading`} title={c.title} count={c.skills.length} />
                            <ul className="mt-4 flex flex-wrap gap-1.5">
                                {c.skills.map((s) => (
                                    <li key={s.name} className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-sm text-foreground/85">
                                        {s.name}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
