import type { Metadata } from "next";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { getServices } from "@/lib/portfolio-data";

// Content comes from Supabase via a cookieless client, so the page is
// static and refreshed at most every five minutes.
export const revalidate = 300;

export const metadata: Metadata = {
    title: "Services",
    description: "The business problems Fil Heinz O. Re La Torre solves with automation, AI and custom software, and the outcomes clients get.",
    alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
    const services = await getServices();

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-12">
                <header>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Services</h1>
                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                        The problems I help businesses solve, what I do about each one, and the outcome you can expect.
                    </p>
                </header>

                {services.length === 0 ? (
                    <p className="text-muted-foreground">Service details coming soon.</p>
                ) : (
                    <div className="flex flex-col gap-6">
                        {services.map((service) => (
                            <section
                                key={service.id}
                                aria-labelledby={`service-${service.id}`}
                                className="rounded-xl border border-border bg-card/50 p-6 space-y-4"
                            >
                                <h2 id={`service-${service.id}`} className="text-xl font-semibold">{service.title}</h2>
                                <dl className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-1">The problem</dt>
                                        <dd className="text-sm text-muted-foreground leading-relaxed">{service.problem}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">What I do</dt>
                                        <dd className="text-sm text-muted-foreground leading-relaxed">{service.solution}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">The outcome</dt>
                                        <dd className="text-sm text-muted-foreground leading-relaxed">{service.outcome}</dd>
                                    </div>
                                </dl>
                            </section>
                        ))}
                    </div>
                )}
            </article>
        </PortfolioPageShell>
    );
}
