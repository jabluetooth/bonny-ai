import type { Metadata } from "next";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { getAuthorProfile, getBackgroundCards, getInterests, getVisionCards } from "@/lib/portfolio-data";

export const metadata: Metadata = {
    title: "About",
    description: "Fil Heinz O. Re La Torre - Software Engineer specializing in full-stack web development and AI/ML. Background, interests, and vision.",
    alternates: { canonical: "/about" },
};

export default async function AboutPage() {
    const [profile, background, interests, vision] = await Promise.all([
        getAuthorProfile(),
        getBackgroundCards(),
        getInterests(),
        getVisionCards(),
    ]);

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-16">
                <header>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">
                        {profile?.title || "About Fil Heinz"}
                    </h1>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap max-w-2xl">
                        {profile?.description ||
                            "I'm Fil Heinz, a proactive full-stack developer passionate about creating dynamic web experiences. From frontend to backend, I thrive on solving complex problems with clean, efficient code."}
                    </p>
                </header>

                {background.length > 0 && (
                    <section aria-labelledby="background-heading">
                        <h2 id="background-heading" className="text-2xl font-semibold mb-6">
                            Background
                        </h2>
                        <ol className="flex flex-col gap-6 border-l border-border pl-6">
                            {background.map((card) => (
                                <li key={card.id}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                                        {card.date_range}
                                    </p>
                                    <h3 className="text-lg font-semibold">{card.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                        {card.description}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                {interests.length > 0 && (
                    <section aria-labelledby="interests-heading">
                        <h2 id="interests-heading" className="text-2xl font-semibold mb-6">
                            Interests
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {interests.map((item) => (
                                <div key={item.title} className="rounded-xl border border-border bg-card/50 p-5">
                                    <h3 className="font-semibold mb-1">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {vision.length > 0 && (
                    <section aria-labelledby="vision-heading">
                        <h2 id="vision-heading" className="text-2xl font-semibold mb-6">
                            Vision
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {vision.map((card, i) => (
                                <blockquote key={i} className="rounded-xl border border-border bg-card/50 p-5">
                                    <p className="text-sm leading-relaxed italic">&ldquo;{card.quote}&rdquo;</p>
                                    <footer className="text-xs text-muted-foreground mt-3">
                                        {card.name}, {card.title}
                                    </footer>
                                </blockquote>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </PortfolioPageShell>
    );
}
