import type { Metadata } from "next";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { getExperiences } from "@/lib/portfolio-data";

export const metadata: Metadata = {
    title: "Experience",
    description: "Work history and education of Fil Heinz O. Re La Torre, Software Engineer.",
    alternates: { canonical: "/experiences" },
};

export default async function ExperiencesPage() {
    const experiences = await getExperiences();

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-12">
                <header>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Experience</h1>
                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                        Work history and education.
                    </p>
                </header>

                {experiences.length === 0 ? (
                    <p className="text-muted-foreground">Experience details coming soon.</p>
                ) : (
                    <ol className="flex flex-col gap-10 border-l border-border pl-6">
                        {experiences.map((exp) => (
                            <li key={exp.id}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                                    {exp.date}
                                </p>
                                <h2 className="text-lg font-bold">{exp.company}</h2>
                                <h3 className="text-base font-semibold text-muted-foreground mb-2">
                                    {exp.role}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    {[exp.location, exp.type].filter(Boolean).join(" · ")}
                                </p>
                                <div className="space-y-2 text-sm leading-relaxed">
                                    {exp.description.map((para, i) => (
                                        <p key={i}>{para}</p>
                                    ))}
                                </div>
                                {exp.tech_stack.length > 0 && (
                                    <ul className="flex flex-wrap gap-2 mt-4">
                                        {exp.tech_stack.map((tech) => (
                                            <li
                                                key={tech}
                                                className="px-3 py-1 text-xs font-medium rounded-xl border border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900"
                                            >
                                                {tech}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ol>
                )}
            </article>
        </PortfolioPageShell>
    );
}
