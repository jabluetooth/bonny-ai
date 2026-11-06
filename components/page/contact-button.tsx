"use client";

import { ArrowRight } from "lucide-react";
import { openContact } from "@/components/contact-cta";

/** Opens the contact drawer from a server-rendered page. */
export function ContactButton({ label = "Work with me" }: { label?: string }) {
    return (
        <button
            type="button"
            onClick={openContact}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
        >
            {label}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </button>
    );
}
