import type { Metadata } from "next";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { PageHeader, StatRow } from "@/components/page/page-parts";
import { PageCta } from "@/components/page/page-cta";
import { CaseStudyGrid } from "@/components/page/case-study-grid";
import { getProjects } from "@/lib/portfolio-data";

// Content comes from Supabase via a cookieless client, so the page is
// static and refreshed at most every five minutes.
export const revalidate = 300;

export const metadata: Metadata = {
    title: "Case Studies",
    description: "Case studies by Fil Heinz O. Re La Torre. The business problem, the solution built, and the results.",
    alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
    const projects = await getProjects();
    const live = projects.filter((p) => p.status === "Online").length;
    const ai = projects.filter((p) => p.type?.toLowerCase().includes("ai")).length;

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-10 md:gap-14">
                <PageHeader
                    eyebrow="Case studies"
                    title="Work that's shipped and running"
                    description="Each project told as the problem, what I built and the result. Open one for the full story, tech stack and features."
                >
                    {projects.length > 0 && (
                        <StatRow stats={[
                            { value: projects.length, label: "projects" },
                            { value: live, label: "live in production" },
                            { value: ai, label: "AI & automation" },
                        ]} />
                    )}
                </PageHeader>

                {projects.length === 0 ? (
                    <p className="text-muted-foreground">Case studies coming soon.</p>
                ) : (
                    <div className="flex flex-col gap-6">
                        <CaseStudyGrid projects={projects} />
                    </div>
                )}

                <PageCta title="Want results like these for your team?" />
            </article>
        </PortfolioPageShell>
    );
}
