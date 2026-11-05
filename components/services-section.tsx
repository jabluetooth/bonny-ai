"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Wrench, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithCache, CACHE_KEYS } from "@/lib/data-cache";

export interface Service {
    id: string;
    title: string;
    problem: string;
    solution: string;
    outcome: string;
    image_url?: string | null;
}

// One labelled row of the problem -> solution -> outcome story.
function StoryRow({ icon, label, text, tone }: { icon: React.ReactNode; label: string; text: string; tone: "problem" | "solution" | "outcome" }) {
    if (!text) return null;
    const toneClass =
        tone === "problem"
            ? "text-red-600 dark:text-red-400"
            : tone === "solution"
                ? "text-blue-600 dark:text-blue-400"
                : "text-emerald-600 dark:text-emerald-400";

    return (
        <div className="flex gap-3">
            <span className={`mt-0.5 shrink-0 ${toneClass}`} aria-hidden>{icon}</span>
            <div className="min-w-0">
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${toneClass}`}>{label}</p>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{text}</p>
            </div>
        </div>
    );
}

export function ServicesSection() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchWithCache<Service[]>(CACHE_KEYS.SERVICES, async () => {
            const res = await fetch("/api/services");
            if (!res.ok) throw new Error("Failed to fetch services");
            return res.json();
        })
            .then(setServices)
            .catch((error) => console.error("Failed to load services", error))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="grid gap-4 p-4 sm:grid-cols-2">
                {[1, 2].map((i) => (
                    <div key={i} className="rounded-xl border p-5 space-y-3">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <p className="p-4 text-sm text-muted-foreground">
                Service details are being updated. Ask me about a specific problem and I&apos;ll explain how I&apos;d approach it.
            </p>
        );
    }

    return (
        <div className="p-4">
            <h2 className="mb-4 text-lg font-semibold">Problems I solve</h2>
            <div className="grid gap-4 sm:grid-cols-2">
                {services.map((service) => (
                    <article key={service.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                        {service.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, arbitrary host
                            <img src={service.image_url} alt="" className="h-36 w-full object-cover" />
                        )}
                        <div className="flex flex-1 flex-col gap-4 p-5">
                            <h3 className="font-semibold leading-snug">{service.title}</h3>
                            <StoryRow tone="problem" label="The problem" text={service.problem} icon={<AlertCircle size={16} />} />
                            <StoryRow tone="solution" label="What I do" text={service.solution} icon={<Wrench size={16} />} />
                            <StoryRow tone="outcome" label="The outcome" text={service.outcome} icon={<TrendingUp size={16} />} />
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
