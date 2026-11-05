"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronRight, Github } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { openContact } from "@/components/contact-cta";

export interface CaseStudy {
    title: string;
    image_url?: string;
    description?: string;
    github_url?: string;
    project_url?: string;
    features: string[];
    tech_stack: string[];
    challenges: string;
    industry?: string;
    problem?: string;
    solution?: string;
    results?: string[];
    type?: string;
    status?: string;
}

function ResultChips({ results, max }: { results?: string[]; max?: number }) {
    if (!results || results.length === 0) return null;
    const shown = max ? results.slice(0, max) : results;
    return (
        <ul className="flex flex-wrap gap-2">
            {shown.map((r) => (
                <li
                    key={r}
                    className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                >
                    {r}
                </li>
            ))}
        </ul>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
            {children}
        </section>
    );
}

function CaseStudyDetail({ study, onClose }: { study: CaseStudy; onClose: () => void }) {
    // Older projects may not have case-study fields filled in yet; fall
    // back to the plain description so they still read sensibly.
    const hasStory = !!(study.problem || study.solution);

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
            {study.image_url && (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, arbitrary host
                <img src={study.image_url} alt="" className="h-56 w-full object-cover object-top" />
            )}
            <div className="space-y-6 p-6">
                <div className="space-y-1">
                    {study.industry && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{study.industry}</p>
                    )}
                    <DialogTitle className="text-2xl">{study.title}</DialogTitle>
                    <DialogDescription className="sr-only">Case study details for {study.title}</DialogDescription>
                </div>

                {study.results && study.results.length > 0 && (
                    <Section label="Results">
                        <ResultChips results={study.results} />
                    </Section>
                )}

                {hasStory ? (
                    <>
                        {study.problem && (
                            <Section label="The problem">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{study.problem}</p>
                            </Section>
                        )}
                        {study.solution && (
                            <Section label="The solution">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{study.solution}</p>
                            </Section>
                        )}
                    </>
                ) : (
                    study.description && (
                        <Section label="Overview">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{study.description}</p>
                        </Section>
                    )
                )}

                {study.features.length > 0 && (
                    <Section label="What was delivered">
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {study.features.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
                                    <span className="leading-snug">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {study.tech_stack.length > 0 && (
                    <Section label="Built with">
                        <p className="text-sm text-muted-foreground">{study.tech_stack.join(" · ")}</p>
                    </Section>
                )}

                <div className="flex flex-wrap gap-2 border-t pt-5">
                    <Button
                        onClick={() => {
                            onClose();
                            openContact();
                        }}
                    >
                        Discuss a similar project
                    </Button>
                    {study.project_url && (
                        <Button variant="outline" asChild>
                            <a href={study.project_url} target="_blank" rel="noopener noreferrer">
                                View live <ArrowUpRight className="ml-1 h-4 w-4" />
                            </a>
                        </Button>
                    )}
                    {study.github_url && (
                        <Button variant="ghost" asChild>
                            <a href={study.github_url} target="_blank" rel="noopener noreferrer">
                                <Github className="mr-1 h-4 w-4" /> Source
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </DialogContent>
    );
}

export function CaseStudyList({ studies }: { studies: CaseStudy[] }) {
    const [active, setActive] = useState<CaseStudy | null>(null);

    return (
        <>
            <ul className="flex flex-col gap-3">
                {studies.map((study, i) => (
                    <li key={`${study.title}-${i}`}>
                        <button
                            type="button"
                            onClick={() => setActive(study)}
                            className="group flex w-full items-start gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {study.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, arbitrary host
                                <img src={study.image_url} alt="" className="hidden h-16 w-16 shrink-0 rounded-lg object-cover object-top sm:block" />
                            )}
                            <div className="min-w-0 flex-1 space-y-2">
                                <div>
                                    {study.industry && (
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{study.industry}</p>
                                    )}
                                    <h3 className="font-semibold leading-snug">{study.title}</h3>
                                </div>
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {study.problem || study.description}
                                </p>
                                <ResultChips results={study.results} max={3} />
                            </div>
                            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </button>
                    </li>
                ))}
            </ul>

            <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
                {active && <CaseStudyDetail study={active} onClose={() => setActive(null)} />}
            </Dialog>
        </>
    );
}
