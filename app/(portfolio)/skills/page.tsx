import type { Metadata } from "next";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { PageHeader, StatRow } from "@/components/page/page-parts";
import { PageCta } from "@/components/page/page-cta";
import { SkillsExplorer } from "@/components/page/skills-explorer";
import { getSkillCategories } from "@/lib/portfolio-data";

// Content comes from Supabase via a cookieless client, so the page is
// static and refreshed at most every five minutes.
export const revalidate = 300;

export const metadata: Metadata = {
    title: "Skills",
    description: "Skills and technologies Fil Heinz O. Re La Torre works with across automation, AI, frontend, backend and design.",
    alternates: { canonical: "/skills" },
};

export default async function SkillsPage() {
    const categories = await getSkillCategories();
    const total = categories.reduce((n, c) => n + c.skills.length, 0);

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-10 md:gap-14">
                <PageHeader
                    title="The toolkit behind the work"
                    description="Tools and technologies I use to build automation, AI systems and full-stack products. Search for the one your team runs on."
                >
                    {total > 0 && (
                        <StatRow stats={[
                            { value: total, label: "skills and tools" },
                            { value: categories.length, label: "categories" },
                        ]} />
                    )}
                </PageHeader>

                {categories.length === 0 ? (
                    <p className="text-muted-foreground">Skills coming soon.</p>
                ) : (
                    <SkillsExplorer categories={categories} />
                )}

                <PageCta title="Using a tool that's not listed?" description="I pick up new stacks quickly. Tell me what your team runs on and what you need it to do." />
            </article>
        </PortfolioPageShell>
    );
}
