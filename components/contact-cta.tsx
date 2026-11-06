"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, FileText, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

// The contact drawer lives in PortfolioNavbar. Anything else that wants to
// open it (chat CTA, project detail) fires this event instead of threading
// state through the tree.
export const OPEN_CONTACT_EVENT = "bonny:open-contact";

export function openContact() {
    window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
}

interface ContactLink {
    platform: string;
    url: string;
}

const LINKEDIN_URL = "https://ph.linkedin.com/in/filheinzrelatorre";

function platformIcon(platform: string) {
    const p = platform.toLowerCase();
    if (p.includes("linkedin")) return Linkedin;
    if (p.includes("github")) return Github;
    if (p.includes("instagram")) return Instagram;
    if (p.includes("mail")) return Mail;
    return ArrowUpRight;
}

interface ActionTileProps {
    icon: React.ReactNode;
    title: string;
    hint: string;
    primary?: boolean;
    onClick?: () => void;
    href?: string;
    index: number;
}

function ActionTile({ icon, title, hint, primary, onClick, href, index }: ActionTileProps) {
    const className = primary
        ? "bg-brand border-brand-hover text-brand-foreground hover:bg-brand-hover"
        : "bg-muted/60 border-border/60 text-foreground hover:border-brand/40";
    const inner = (
        <>
            <span className={primary ? "text-brand-foreground" : "text-brand"} aria-hidden>{icon}</span>
            <span className="flex flex-col">
                <span className="text-sm font-semibold">{title}</span>
                <span className={primary ? "text-xs text-brand-foreground/90" : "text-xs text-muted-foreground"}>{hint}</span>
            </span>
        </>
    );
    const motionProps = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.1 + index * 0.08, duration: 0.3 },
        whileHover: { y: -3 },
        whileTap: { scale: 0.97 },
        className: `flex items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition-colors ${className}`,
    };
    return href ? (
        <motion.a {...motionProps} href={href} target="_blank" rel="noopener noreferrer">{inner}</motion.a>
    ) : (
        <motion.button {...motionProps} type="button" onClick={onClick}>{inner}</motion.button>
    );
}

/** Branded "let's work together" card shown in the chat for contact intents. */
export function ContactCta() {
    const [links, setLinks] = useState<ContactLink[]>([]);
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);

    useEffect(() => {
        supabase
            .from("contact_links")
            .select("platform, url")
            .eq("is_active", true)
            .then(({ data }) => setLinks(data ?? []));

        fetch("/api/resume")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => setResumeUrl(data?.resume_url ?? null))
            .catch(() => setResumeUrl(null));
    }, []);

    return (
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-xl sm:p-6">
            {/* Soft brand glow */}
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/15 blur-3xl" />

            <div className="relative flex items-center gap-4">
                <Image src="/bot-avatar.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
                <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-tight sm:text-xl">Let&apos;s work together</h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        Usually replies within one business day
                    </p>
                </div>
            </div>

            <p className="relative mt-4 max-w-[65ch] type-body text-muted-foreground">
                Tell me what you&apos;re trying to fix or build, your timeline, and how you&apos;ll measure success. Hiring? Grab my resume or reach me on LinkedIn.
            </p>

            <div className="relative mt-4 grid gap-2 sm:grid-cols-3">
                <ActionTile index={0} primary icon={<Mail size={20} />} title="Send a message" hint="Describe your project" onClick={openContact} />
                {resumeUrl && (
                    <ActionTile index={1} icon={<FileText size={20} />} title="Download resume" hint="PDF, for recruiters" href={resumeUrl} />
                )}
                <ActionTile index={2} icon={<Linkedin size={20} />} title="LinkedIn" hint="Connect or message" href={LINKEDIN_URL} />
            </div>

            {links.length > 0 && (
                <ul className="relative mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-4">
                    {links.map((l) => {
                        const Icon = platformIcon(l.platform);
                        return (
                            <li key={l.url}>
                                <a
                                    href={l.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Icon size={13} aria-hidden />
                                    {l.platform}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
