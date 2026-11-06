import type { Metadata } from "next";
import { AlertCircle, TrendingUp, Wrench } from "lucide-react";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { JumpNav, PageHeader, StatRow, slug } from "@/components/page/page-parts";
import { PageCta } from "@/components/page/page-cta";
import { ProjectMedia } from "@/components/page/project-media";
import { getServices } from "@/lib/portfolio-data";

// Content comes from Supabase via a cookieless client, so the page is
// static and refreshed at most every five minutes.
export const revalidate = 300;

export const metadata: Metadata = {
    title: "Services",
    description: "The business problems Fil Heinz O. Re La Torre solves with automation, AI and custom software, and the outcomes clients get.",
    alternates: { canonical: "/services" },
};

const STEPS = [
    { key: "problem", label: "The problem", Icon: AlertCircle, tone: "text-danger" },
    { key: "solution", label: "What I build", Icon: Wrench, tone: "text-brand" },
    { key: "outcome", label: "The outcome", Icon: TrendingUp, tone: "text-success" },
] as const;

export default async function ServicesPage() {
    const services = await getServices();

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-12 md:gap-16">
                <div className="flex flex-col gap-6">
                    <PageHeader
                        title="Problems I solve for growing teams"
                        description="Each service starts with a problem I see in businesses again and again, what I build to fix it, and the outcome you can expect."
                    >
                        {services.length > 0 && (
                            <StatRow stats={[
                                { value: services.length, label: "services" },
                                { value: "AI · Automation", label: "core focus" },
                                { value: "End to end", label: "from first call to launch" },
                            ]} />
                        )}
                    </PageHeader>
                    <JumpNav label="Services on this page" items={services.map((s) => ({ id: slug(s.title), label: s.title }))} />
                </div>

                {services.length === 0 ? (
                    <p className="text-muted-foreground">Service details coming soon.</p>
                ) : (
                    <ol className="flex flex-col gap-6">
                        {services.map((service, i) => (
                            <li key={service.id} id={slug(service.title)} className="scroll-mt-24">
                                <section
                                    aria-labelledby={`service-${service.id}`}
                                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                                >
                                    {service.image_url && (
                                        <div className="relative h-44 w-full sm:h-56">
                                            <ProjectMedia src={service.image_url} sizes="(min-width: 1024px) 960px, 100vw" className="object-center" />
                                        </div>
                                    )}
                                    <div className="p-6 sm:p-8">
                                        <div className="mb-6 flex items-start gap-4">
                                            <span className="font-mono text-sm tabular-nums text-muted-foreground" aria-hidden>
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <h2 id={`service-${service.id}`} className="text-xl font-semibold tracking-tight sm:text-2xl">
                                                {service.title}
                                            </h2>
                                        </div>
                                        <dl className="grid gap-6 sm:grid-cols-3 sm:gap-8">
                                            {STEPS.map(({ key, label, Icon, tone }) => {
                                                const text = service[key];
                                                if (!text) return null;
                                                return (
                                                    <div key={key} className="border-t border-border pt-4">
                                                        <dt className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${tone}`}>
                                                            <Icon size={14} aria-hidden /> {label}
                                                        </dt>
                                                        <dd className={`text-sm leading-relaxed ${key === "outcome" ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                                            {text}
                                                        </dd>
                                                    </div>
                                                );
                                            })}
                                        </dl>
                                    </div>
                                </section>
                            </li>
                        ))}
                    </ol>
                )}

                <PageCta />
            </article>
        </PortfolioPageShell>
    );
}
