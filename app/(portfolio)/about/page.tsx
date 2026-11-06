import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Briefcase, FileText, Github, Layers, LineChart, Linkedin, Wrench } from "lucide-react";
import { PortfolioPageShell } from "@/components/portfolio-page-shell";
import { PageCta } from "@/components/page/page-cta";
import { ContactButton } from "@/components/page/contact-button";
import { getAuthorProfile } from "@/lib/portfolio-data";

// Content comes from Supabase via a cookieless client, so the page is
// static and refreshed at most every five minutes.
export const revalidate = 300;

export const metadata: Metadata = {
    title: "About",
    description: "Fil Heinz O. Re La Torre, Automation & AI Solutions Engineer. I help businesses replace slow, manual processes with reliable systems.",
    alternates: { canonical: "/about" },
};

const STATUS: Record<string, { text: string; dot: string }> = {
    available_fulltime: { text: "Available for new projects", dot: "bg-emerald-500" },
    available_parttime: { text: "Available for project work", dot: "bg-amber-500" },
    open_for_discussion: { text: "Open to conversations", dot: "bg-blue-500" },
    busy: { text: "Fully booked", dot: "bg-red-500" },
};

const EXPLORE = [
    { href: "/services", title: "Services", text: "The problems I solve and the outcomes you get.", Icon: Wrench },
    { href: "/projects", title: "Case studies", text: "Shipped projects, told as problem, build and result.", Icon: LineChart },
    { href: "/experiences", title: "Experience", text: "Roles, responsibilities and education.", Icon: Briefcase },
    { href: "/skills", title: "Skills", text: "The tools and technologies I work with.", Icon: Layers },
];

const SOCIALS = [
    { label: "LinkedIn", href: "https://ph.linkedin.com/in/filheinzrelatorre", Icon: Linkedin },
    { label: "GitHub", href: "https://github.com/jabluetooth", Icon: Github },
];

export default async function AboutPage() {
    const profile = await getAuthorProfile();
    const status = STATUS[profile?.status || ""] ?? STATUS.available_fulltime;
    const photo = profile?.images?.[0];

    return (
        <PortfolioPageShell>
            <article className="flex flex-col gap-12 md:gap-16">
                <section className="grid items-start gap-8 md:grid-cols-[17rem_1fr] md:gap-12">
                    {/* Profile card */}
                    <div className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                        <div className="relative aspect-[4/5] bg-muted">
                            {photo ? (
                                <Image src={photo} alt="Fil Heinz O. Re La Torre" fill sizes="272px" className="object-cover" priority />
                            ) : (
                                <Image src="/bot-avatar.png" alt="" fill sizes="272px" className="object-contain p-8" />
                            )}
                        </div>
                        <div className="flex flex-col gap-3 p-4">
                            <p className="inline-flex items-center gap-2 text-xs font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${status.dot}`} />
                                    <span className={`relative inline-flex h-2 w-2 rounded-full ${status.dot}`} />
                                </span>
                                {status.text}
                            </p>
                            <div className="flex gap-1">
                                {SOCIALS.map(({ label, href, Icon }) => (
                                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (new tab)`} className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                        <Icon size={17} aria-hidden />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Intro */}
                    <div className="flex flex-col gap-5">
                        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
                            {profile?.headline || profile?.title || "Fil Heinz O. Re La Torre"}
                        </h1>
                        {profile?.subheadline && (
                            <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{profile.subheadline}</p>
                        )}
                        <div className="max-w-2xl space-y-4 text-base leading-relaxed text-foreground/85">
                            {(profile?.description ||
                                "I'm Fil Heinz, an automation and AI solutions engineer. I help teams replace slow, manual processes with reliable systems, from first conversation to production.")
                                .split(/\n{2,}/)
                                .map((para, i) => <p key={i} className="whitespace-pre-wrap">{para}</p>)}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3">
                            <ContactButton />
                            {profile?.resume_url && (
                                <a
                                    href={profile.resume_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                                >
                                    <FileText size={16} aria-hidden />
                                    Download resume
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* Explore */}
                <section aria-labelledby="explore-heading" className="flex flex-col gap-5">
                    <h2 id="explore-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">Explore my work</h2>
                    <ul className="grid gap-4 sm:grid-cols-2">
                        {EXPLORE.map(({ href, title, text, Icon }) => (
                            <li key={href}>
                                <Link href={href} className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                                    <span className="rounded-xl bg-muted p-2.5 text-foreground" aria-hidden><Icon size={18} /></span>
                                    <span className="flex-1">
                                        <span className="flex items-center gap-1 font-semibold">
                                            {title}
                                            <ArrowUpRight size={15} className="text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                        </span>
                                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{text}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <PageCta />
            </article>
        </PortfolioPageShell>
    );
}
