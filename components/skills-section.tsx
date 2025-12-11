"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from "@/components/ui/marquee";
import { Separator } from "@/components/ui/separator";
import { Cpu, Globe, Database, Palette, Users } from "lucide-react";



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
                const res = await fetch('/api/skills');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                }
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
            // Strict skill filter
            return categories.map(cat => ({
                ...cat,
                skills: cat.skills.filter((s: any) => s.name.toLowerCase() === highlightSkill.toLowerCase())
            })).filter(cat => cat.skills.length > 0);
        }
        if (highlightCategory) {
            // Loose category filter (e.g. "Frontend" matches "Frontend Development")
            return categories.filter(cat => cat.title.toLowerCase().includes(highlightCategory.toLowerCase()));
        }
        return categories;
    })();

    // Extract highlights for Marquee
    // Show Marquee for General AND Category views. Hide ONLY for specific Skill view.
    const marqueeSkills = highlightSkill ? [] : categories.flatMap(cat => cat.skills).filter((s: any) => s.is_highlight);

    const handleCategoryClick = (title: string) => {
        sendMessage(`What are your ${title} skills?`);
    };

    const handleSkillClick = (skillName: string) => {
        sendMessage(`Tell me about your experience with ${skillName}.`);
    };

    if (isLoading) {
        return (
            <div className="w-full h-48 animate-pulse rounded-xl border border-border/40 bg-card/50 shadow-sm p-4 flex flex-col gap-4">
                <div className="h-20 bg-muted/20 rounded-lg w-full"></div>
                <div className="h-4 bg-muted/20 rounded w-1/3"></div>
                <div className="h-10 bg-muted/20 rounded w-2/3"></div>
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
                            <MarqueeContent>
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
                                    title={`Ask about ${skill.name}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSkillClick(skill.name);
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-xl shadow-sm border transition-all cursor-pointer whitespace-normal h-auto text-left max-w-full leading-snug break-words",
                                        "bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-900",
                                        // Highlight skill if match
                                        highlightSkill && "ring-2 ring-primary/50"
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
