import type { Metadata } from "next";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { getAuthorProfile } from "@/lib/portfolio-data";

export const metadata: Metadata = {
    title: "About",
    description: "Fil Heinz O. Re La Torre, Automation & AI Solutions Engineer. I help businesses replace slow, manual processes with reliable systems.",
    alternates: { canonical: "/about" },
};

export default async function AboutPage() {
    const profile = await getAuthorProfile();

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-6">
                <h1 className="text-4xl font-bold tracking-tight">
                    {profile?.headline || profile?.title || "About Fil Heinz"}
                </h1>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap max-w-2xl">
                    {profile?.description ||
                        "I'm Fil Heinz, an automation and AI solutions engineer. I help teams replace slow, manual processes with reliable systems, from first conversation to production."}
                </p>
            </article>
        </PortfolioPageShell>
    );
}
