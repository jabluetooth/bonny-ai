"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { openContact } from "@/components/contact-cta";

/** Closing call to action shared by the standalone pages. */
export function PageCta({
    title = "Have a process that's slowing your team down?",
    description = "Tell me what you're trying to fix or build. I'll reply with how I'd approach it, usually within one business day.",
}: {
    title?: string;
    description?: string;
}) {
    return (
        <section aria-labelledby="page-cta-heading" className="rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
            <h2 id="page-cta-heading" className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h2>
            <p className="mt-3 max-w-xl type-body opacity-80">{description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={openContact}
                    className="group inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary transition-transform hover:scale-[1.02] active:scale-95"
                >
                    Work with me
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
                >
                    <MessageCircle size={16} />
                    Ask Bonny-AI
                </Link>
            </div>
        </section>
    );
}
