"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertCircle, ArrowRight, TrendingUp, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@/components/chat-provider";
import { fetchWithCache, CACHE_KEYS } from "@/lib/data-cache";
import { cn } from "@/lib/utils";

export interface Service {
    id: string;
    title: string;
    problem: string;
    solution: string;
    outcome: string;
    image_url?: string | null;
}

const STEPS = [
    { key: "problem", label: "The problem", Icon: AlertCircle, dot: "bg-red-500", text: "text-danger" },
    { key: "solution", label: "What I build", Icon: Wrench, dot: "bg-brand", text: "text-brand" },
    { key: "outcome", label: "The outcome", Icon: TrendingUp, dot: "bg-emerald-500", text: "text-success" },
] as const;

const pad = (n: number) => String(n + 1).padStart(2, "0");

/**
 * Interactive "problems I solve" picker for the chat. Pick a service and its
 * problem, solution and outcome play out as a short flow; the ask button
 * turns it into a follow-up chat message.
 */
export function ServicesSection() {
    const { sendMessage, isLoading: chatBusy } = useChat();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    // Scope the sliding pill so several of these in one chat don't share it.
    const groupId = useId();
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
            <div className="grid gap-4 p-4 sm:grid-cols-[14rem_1fr]">
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <p className="p-4 text-sm text-muted-foreground">
                Service details are being updated. Describe your problem and I&apos;ll explain how I&apos;d approach it.
            </p>
        );
    }

    const active = services[Math.min(activeIndex, services.length - 1)];
    const tabId = (i: number) => `${groupId}-tab-${i}`;
    const panelId = `${groupId}-panel`;

    const onTabKey = (e: React.KeyboardEvent, i: number) => {
        const last = services.length - 1;
        const next =
            e.key === "ArrowDown" || e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
            : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
            : e.key === "Home" ? 0
            : e.key === "End" ? last
            : -1;
        if (next < 0) return;
        e.preventDefault();
        setActiveIndex(next);
        tabRefs.current[next]?.focus();
    };

    return (
        <LayoutGroup id={groupId}>
        <div className="p-2 sm:p-4">
            <div className="mb-3 px-1">
                <h2 className="text-xl font-semibold">Problems I solve</h2>
                <p className="text-sm text-muted-foreground">Pick one to see how I&apos;d fix it.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
                {/* Picker: a swipeable row on phones, a numbered list from sm up */}
                <div role="tablist" aria-label="Services" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] sm:flex-col sm:overflow-visible sm:pb-0">
                    {services.map((s, i) => {
                        const selected = s.id === active.id;
                        return (
                            <button
                                key={s.id}
                                ref={(el) => { tabRefs.current[i] = el; }}
                                id={tabId(i)}
                                role="tab"
                                aria-selected={selected}
                                aria-controls={panelId}
                                tabIndex={selected ? 0 : -1}
                                type="button"
                                onClick={() => setActiveIndex(i)}
                                onKeyDown={(e) => onTabKey(e, i)}
                                className={cn(
                                    "relative shrink-0 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                                    selected ? "text-brand-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                )}
                            >
                                {selected && (
                                    <motion.span
                                        layoutId="service-pill"
                                        className="absolute inset-0 rounded-xl bg-brand border border-brand-hover shadow-md"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                                    />
                                )}
                                <span className={cn("relative font-mono text-xs tabular-nums", selected ? "text-brand-foreground/90" : "text-muted-foreground")}>{pad(i)}</span>
                                <span className="relative font-medium leading-snug whitespace-nowrap sm:whitespace-normal">{s.title}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Detail panel */}
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card to-card/70 backdrop-blur-md shadow-xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            role="tabpanel"
                            id={panelId}
                            aria-labelledby={tabId(Math.min(activeIndex, services.length - 1))}
                            tabIndex={0}
                        >
                            {active.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, arbitrary host
                                <img src={active.image_url} alt="" className="h-36 w-full object-cover sm:h-44" />
                            )}

                            <div className="p-4 sm:p-6">
                                <h3 className="mb-5 text-lg font-bold leading-snug sm:text-xl">{active.title}</h3>

                                {/* Problem -> solution -> outcome flow */}
                                <ol className="relative space-y-5 pl-7">
                                    <span aria-hidden className="absolute left-[7px] top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-red-500/60 via-blue-500/60 to-emerald-500/60" />
                                    {STEPS.map(({ key, label, Icon, dot, text }, i) => {
                                        const body = active[key];
                                        if (!body) return null;
                                        return (
                                            <motion.li
                                                key={key}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.08 + i * 0.12, duration: 0.3 }}
                                                className="relative"
                                            >
                                                <span aria-hidden className={cn("absolute -left-7 top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background", dot)} />
                                                <p className={cn("mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider", text)}>
                                                    <Icon size={13} aria-hidden /> {label}
                                                </p>
                                                <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", key === "outcome" ? "font-medium text-foreground" : "text-muted-foreground")}>
                                                    {body}
                                                </p>
                                            </motion.li>
                                        );
                                    })}
                                </ol>

                                <button
                                    type="button"
                                    disabled={chatBusy}
                                    onClick={() => sendMessage(`How would "${active.title}" work for my business?`)}
                                    className="group mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-all hover:bg-brand-hover hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Ask how this fits my business
                                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
        </LayoutGroup>
    );
}
