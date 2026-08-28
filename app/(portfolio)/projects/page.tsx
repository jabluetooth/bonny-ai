import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { getProjects } from "@/lib/portfolio-data";
import { Github, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
    title: "Projects",
    description: "Web development and AI/ML projects built by Fil Heinz O. Re La Torre.",
    alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-12">
                <header>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Projects</h1>
                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                        A selection of web development and AI/ML projects I&apos;ve built.
                    </p>
                </header>

                {projects.length === 0 ? (
                    <p className="text-muted-foreground">Projects coming soon.</p>
                ) : (
                    <div className="flex flex-col gap-8">
                        {projects.map((project) => (
                            <section
                                key={project.title}
                                className="rounded-xl border border-border bg-card/50 p-6"
                                aria-labelledby={`${project.title}-heading`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                                    <h2 id={`${project.title}-heading`} className="text-xl font-semibold">
                                        {project.title}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        {project.github_url && (
                                            <Link
                                                href={project.github_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`${project.title} source code on GitHub`}
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Github size={18} />
                                            </Link>
                                        )}
                                        {project.project_url && (
                                            <Link
                                                href={project.project_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`${project.title} live site`}
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <ExternalLink size={18} />
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {project.description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                        {project.description}
                                    </p>
                                )}

                                {project.features.length > 0 && (
                                    <ul className="list-disc list-inside text-sm text-muted-foreground mb-4 space-y-1">
                                        {project.features.map((feature) => (
                                            <li key={feature}>{feature}</li>
                                        ))}
                                    </ul>
                                )}

                                {project.tech_stack.length > 0 && (
                                    <ul className="flex flex-wrap gap-2">
                                        {project.tech_stack.map((tech) => (
                                            <li
                                                key={tech}
                                                className="px-3 py-1 text-xs font-medium rounded-xl border border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900"
                                            >
                                                {tech}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>
                )}
            </article>
        </PortfolioPageShell>
    );
}
