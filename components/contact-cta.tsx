"use client";

import { useEffect, useState } from "react";
import { FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";

// The contact drawer lives in PortfolioNavbar. Anything else that wants to
// open it (chat CTA, case-study dialog) fires this event instead of
// threading state through the tree.
export const OPEN_CONTACT_EVENT = "bonny:open-contact";

export function openContact() {
    window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
}

interface ContactLink {
    platform: string;
    url: string;
}

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
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="space-y-1">
                <h3 className="font-semibold">Let&apos;s talk about your project</h3>
                <p className="text-sm text-muted-foreground">
                    Share what you&apos;re trying to fix or build, your timeline, and how you measure success. I usually reply within one business day.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button onClick={openContact}>
                    <Mail className="mr-2 h-4 w-4" /> Send a message
                </Button>
                {resumeUrl && (
                    <Button variant="outline" asChild>
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" /> Download resume
                        </a>
                    </Button>
                )}
            </div>

            {links.length > 0 && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-sm">
                    {links.map((l) => (
                        <li key={l.url}>
                            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                                {l.platform}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
