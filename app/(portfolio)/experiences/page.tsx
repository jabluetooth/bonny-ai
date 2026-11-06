import type { Metadata } from "next";
import { Briefcase, Calendar, GraduationCap, MapPin } from "lucide-react";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { JumpNav, PageHeader, SectionHeading, StatRow, TagList } from "@/components/page/page-parts";
import { PageCta } from "@/components/page/page-cta";
import { getExperiences, type PortfolioExperience } from "@/lib/portfolio-data";

// Content comes from Supabase via a cookieless client, so the page is
// static and refreshed at most every five minutes.
export const revalidate = 300;

export const metadata: Metadata = {
    title: "Experience",
    description: "Work history and education of Fil Heinz O. Re La Torre, Automation & AI Solutions Engineer.",
    alternates: { canonical: "/experiences" },
};

function Timeline({ items, education }: { items: PortfolioExperience[]; education?: boolean }) {
    const Icon = education ? GraduationCap : Briefcase;
    return (
        <ol className="relative flex flex-col gap-6 pl-8 sm:pl-10">
            <span aria-hidden className="absolute left-[11px] top-3 bottom-3 w-px bg-border sm:left-[15px]" />
            {items.map((exp, i) => (
                <li key={exp.id} className="relative">
                    <span
                        aria-hidden
                        className={`absolute -left-8 top-5 flex h-6 w-6 items-center justify-center rounded-full border sm:-left-10 sm:h-8 sm:w-8 ${i === 0 && !education ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
                    >
                        <Icon size={13} />
                    </span>
                    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{exp.company}</p>
                                <h3 className="text-xl font-semibold leading-snug tracking-tight">{exp.role}</h3>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium tabular-nums">
                                <Calendar size={12} aria-hidden />
                                {exp.date}
                            </span>
                        </div>

                        {(exp.location || exp.type) && (
                            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {exp.location && <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{exp.location}</span>}
                                {exp.type && <span className="inline-flex items-center gap-1"><Briefcase size={12} aria-hidden />{exp.type}</span>}
                            </p>
                        )}

                        {exp.description.length > 0 && (
                            <ul className="mt-4 max-w-[65ch] space-y-2 type-body text-foreground/85">
                                {exp.description.map((para, j) => (
                                    <li key={j} className="flex gap-2.5">
                                        <span aria-hidden className="mt-[0.7rem] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                                        <span>{para}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <TagList tags={exp.tech_stack} label="Tools used" className="mt-4" />
                    </article>
                </li>
            ))}
        </ol>
    );
}

export default async function ExperiencesPage() {
    const experiences = await getExperiences();
    const work = experiences.filter((e) => e.category !== "education");
    const education = experiences.filter((e) => e.category === "education");
    const sections = [
        ...(work.length ? [{ id: "work", label: "Work" }] : []),
        ...(education.length ? [{ id: "education", label: "Education" }] : []),
    ];

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-10 md:gap-14">
                <div className="flex flex-col gap-6">
                    <PageHeader
                        title="Where I've built and what I've delivered"
                        description="Roles, responsibilities and the tools I used, followed by my education."
                    >
                        {experiences.length > 0 && (
                            <StatRow stats={[
                                { value: work.length, label: work.length === 1 ? "role" : "roles" },
                                { value: education.length, label: "education" },
                            ]} />
                        )}
                    </PageHeader>
                    <JumpNav label="Sections on this page" items={sections} />
                </div>

                {experiences.length === 0 ? (
                    <p className="text-muted-foreground">Experience details coming soon.</p>
                ) : (
                    <>
                        {work.length > 0 && (
                            <section aria-labelledby="work" className="flex flex-col gap-6">
                                <SectionHeading id="work" title="Work" count={work.length} />
                                <Timeline items={work} />
                            </section>
                        )}
                        {education.length > 0 && (
                            <section aria-labelledby="education" className="flex flex-col gap-6">
                                <SectionHeading id="education" title="Education" count={education.length} />
                                <Timeline items={education} education />
                            </section>
                        )}
                    </>
                )}

                <PageCta />
            </article>
        </PortfolioPageShell>
    );
}
