"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from "@/components/ui/marquee";
import { Separator } from "@/components/ui/separator";
import { Cpu, Globe, Database, Palette, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithCache, CACHE_KEYS } from "@/lib/data-cache";



const SkillCard = ({
    img,
    name,
}: {
    img: string;
    name: string;
}) => {
    return (
        <figure
            className={cn(
                "relative w-16 h-16 cursor-pointer overflow-hidden rounded-full border p-2",
                "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
                "flex items-center justify-center"
            )}
        >
            <img className="h-10 w-10 object-contain" alt={name} src={img} />
        </figure>
    );
};

import { useChat } from "@/components/chat-provider";

export function SkillsSection({ highlightSkill, highlightCategory }: { highlightSkill?: string, highlightCategory?: string }) {
    const { sendMessage } = useChat();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSkills() {
            try {
                const data = await fetchWithCache(
                    CACHE_KEYS.SKILLS,
                    async () => {
                        const res = await fetch('/api/skills');
                        if (!res.ok) throw new Error('Failed to fetch skills');
                        return res.json();
                    }
                );
                setCategories(data.categories || []);
            } catch (error) {
                console.error("Failed to load skills", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSkills();
    }, []);

    // Filter categories logic
    const filteredCategories = (() => {
        if (highlightSkill) {
            // 1. Try Strict skill filter
            const skillFiltered = categories.map(cat => ({
                ...cat,
                skills: cat.skills.filter((s: any) => s.name.toLowerCase() === highlightSkill.toLowerCase())
            })).filter(cat => cat.skills.length > 0);

            if (skillFiltered.length > 0) return skillFiltered;

            // 2. Fallback: Try as Category filter (if LLM confused SKILL with CATEGORY)
            return categories.filter(cat => cat.title.toLowerCase().includes(highlightSkill.toLowerCase()));
        }
        if (highlightCategory) {
            // Loose category filter (e.g. "Frontend" matches "Frontend Development")
            return categories.filter(cat => cat.title.toLowerCase().includes(highlightCategory.toLowerCase()));
        }
        return categories;
    })();

    // Extract highlights for Marquee
    // Show Marquee for General AND Category views. Hide ONLY for specific Skill view.
    // Memoized to prevent react-fast-marquee from recalculating on every re-render
    const marqueeSkills = useMemo(() => {
        if (highlightSkill) return [];
        return categories.flatMap(cat => cat.skills).filter((s: any) => s.is_highlight);
    }, [categories, highlightSkill]);

    const handleCategoryClick = (title: string) => {
        sendMessage(`What are your ${title} skills?`);
    };



    if (isLoading) {
        return (
            <div className="w-full max-w-full min-w-0 flex flex-col gap-2 p-2 rounded-xl animate-in fade-in">
                {/* Marquee Header Match */}
                <div className="w-full h-24 mb-2">
                    <Skeleton className="w-full h-full" />
                </div>

                {/* Category Group 1 */}
                <div className="flex flex-col gap-3 mt-2 px-1">
                    <Skeleton className="h-5 w-32 rounded" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-24 rounded-xl" />
                        <Skeleton className="h-8 w-32 rounded-xl" />
                        <Skeleton className="h-8 w-20 rounded-xl" />
                        <Skeleton className="h-8 w-28 rounded-xl" />
                    </div>
                </div>

                {/* Category Group 2 */}
                <div className="flex flex-col gap-3 mt-4 px-1">
                    <Skeleton className="h-5 w-24 rounded" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-20 rounded-xl" />
                        <Skeleton className="h-8 w-24 rounded-xl" />
                        <Skeleton className="h-8 w-16 rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (categories.length === 0) {
        return null; // Don't show if no data
    }

    // If filter results in empty, don't show component
    if ((highlightSkill || highlightCategory) && filteredCategories.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-full min-w-0 flex flex-col gap-2 p-2 rounded-xl border border-border/40 bg-card/50 shadow-sm animate-in fade-in slide-in-from-bottom-2">

            {/* 1. Highlights Marquee (Hidden if specific skill highlighted) */}
            {marqueeSkills.length > 0 && (
                <>
                    <div className="w-full max-w-full relative overflow-hidden h-24">
                        <Marquee className="h-full">
                            <MarqueeFade side="left" />
                            <MarqueeFade side="right" />
                            <MarqueeContent
                                key={`marquee-${marqueeSkills.length}`}
                                speed={50}
                                delay={0.5}
                            >
                                {marqueeSkills.map((skill: any) => (
                                    <MarqueeItem key={skill.name}>
                                        <SkillCard name={skill.name} img={skill.icon_url || ""} />
                                    </MarqueeItem>
                                ))}
                            </MarqueeContent>
                        </Marquee>
                    </div>
                    <Separator />
                </>
            )}

            {/* 2. Dynamic Categories */}
            <div className="flex flex-col gap-5 w-full max-w-full min-w-0 overflow-hidden mt-2">
                {filteredCategories.map((group) => (
                    <div key={group.title} className="flex flex-col gap-3 max-w-full min-w-0">
                        <div
                            className="flex items-center gap-2 text-foreground font-semibold text-sm cursor-pointer hover:text-primary transition-colors w-fit"
                            onClick={() => handleCategoryClick(group.title)}
                            title={`Ask about ${group.title}`}
                        >
                            {(group.icon_name === 'Globe' || group.title.includes('Frontend')) && <Globe className="w-4 h-4 text-current" />}
                            {(group.icon_name === 'Cpu' || group.title.includes('Backend')) && <Cpu className="w-4 h-4 text-current" />}
                            {(group.icon_name === 'Palette' || group.title.includes('Design')) && <Palette className="w-4 h-4 text-current" />}
                            {(group.icon_name === 'Users' || group.title.includes('Soft')) && <Users className="w-4 h-4 text-current" />}
                            {group.title}
                        </div>
                        <div className="flex flex-wrap gap-2 max-w-full">
                            {group.skills.map((skill: any) => (
                                <span
                                    key={skill.name}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-xl border whitespace-normal h-auto text-left max-w-full leading-snug break-words",
                                        "bg-zinc-900 text-white border-zinc-800 dark:bg-white dark:text-zinc-900"
                                    )}
                                >
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
