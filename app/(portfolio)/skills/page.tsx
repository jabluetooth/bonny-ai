import type { Metadata } from "next";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { getSkillCategories } from "@/lib/portfolio-data";

export const metadata: Metadata = {
    title: "Skills",
    description: "Skills and technologies Fil Heinz O. Re La Torre works with across frontend, backend, design, and AI/ML.",
    alternates: { canonical: "/skills" },
};

export default async function SkillsPage() {
    const categories = await getSkillCategories();

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-12">
                <header>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Skills</h1>
                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                        Technologies and tools I use to build full-stack web applications and AI/ML systems.
                    </p>
                </header>

                {categories.length === 0 ? (
                    <p className="text-muted-foreground">Skills coming soon.</p>
                ) : (
                    categories.map((category) => (
                        <section key={category.title} aria-labelledby={`${category.title}-heading`}>
                            <h2 id={`${category.title}-heading`} className="text-xl font-semibold mb-4">
                                {category.title}
                            </h2>
                            <ul className="flex flex-wrap gap-2">
                                {category.skills.map((skill) => (
                                    <li
                                        key={skill.name}
                                        className="px-3 py-1.5 text-sm font-medium rounded-xl border border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900"
                                    >
                                        {skill.name}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
                )}
            </article>
        </PortfolioPageShell>
    );
}
