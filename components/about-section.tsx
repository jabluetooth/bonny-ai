"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { openContact } from "@/components/contact-cta";

interface AuthorProfile {
    title?: string | null;
    headline?: string | null;
    description: string;
    images: string[];
}

const FALLBACK_BIO =
    "I'm Fil Heinz, an automation and AI solutions engineer. I help teams replace slow, manual processes with reliable systems, from first conversation to production.";

export function AboutSection() {
    const [profile, setProfile] = useState<AuthorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase
            .from("author_profiles")
            .select("*")
            .eq("is_active", true)
            .maybeSingle()
            .then(({ data }) => setProfile(data ?? null))
            .then(() => setIsLoading(false), () => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="w-full rounded-xl border p-6 flex flex-col gap-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        );
    }

    const image = profile?.images?.[0];
    const heading = profile?.headline || profile?.title || "Fil Heinz O. Re La Torre";

    return (
        <div className="w-full rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row gap-6 items-start">
            {image && (
                <Image
                    src={image}
                    alt="Fil Heinz"
                    width={128}
                    height={128}
                    className="h-28 w-28 shrink-0 rounded-xl object-cover"
                />
            )}
            <div className="flex-1 space-y-3 min-w-0">
                <h3 className="text-xl font-semibold leading-snug">{heading}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {profile?.description || FALLBACK_BIO}
                </p>
                <Button size="sm" onClick={openContact}>
                    <Mail className="mr-2 h-4 w-4" /> Work with me
                </Button>
            </div>
        </div>
    );
}
