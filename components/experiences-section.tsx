"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Experience {
    id: number;
    category?: string;
    company: string;
    role: string;
    date: string;
    location: string;
    type: string;
    logo_url?: string;
    description: string[];
    tech_stack: string[];
}

// Wrapper component handles data fetching and finding the scroll container
export function ExperiencesSection({ category }: { category?: string }) {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // Find the chat scroll container by the ID we assigned
        const scrollElement = document.getElementById("chat-scroll-area");
        if (scrollElement) {
            setContainer(scrollElement);
        }
    }, []);

    useEffect(() => {
        async function fetchExperiences() {
            try {
                const res = await fetch('/api/experiences');
                if (res.ok) {
                    const data = await res.json();
                    setExperiences(data);
                }
            } catch (error) {
                console.error("Failed to load experiences", error);
            }
        }
        fetchExperiences();
    }, []);

    // Filter based on category if provided
    const filteredExperiences = category
        ? experiences.filter(exp => exp.category === category || (!exp.category && category === 'work'))
        : experiences;

    if (!container || filteredExperiences.length === 0) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 py-20" id="experiences">
                {/* Title Skeleton */}
                <div className="flex justify-center mb-16">
                    <Skeleton className="h-10 w-48 rounded-md bg-gray-200" />
                </div>
                <div className="flex flex-col gap-16 relative min-h-[400px]">
                    {/* Timeline Line Skeleton */}
                    <div className="absolute left-8 md:left-[35%] transform -translate-x-1/2 w-[2px] h-full bg-gray-200" />

                    {[1, 2, 3].map((i) => (
                        <div key={i} className="relative grid grid-cols-1 md:grid-cols-[35%_1fr] gap-8 md:gap-0">
                            {/* Dot */}
                            <div className="absolute left-8 md:left-[35%] transform -translate-x-1/2 w-4 h-4 rounded-full bg-gray-200" />

                            {/* Left Side (Company & Date) */}
                            <div className="md:text-left flex flex-col items-start md:items-start pl-20 md:pl-0 md:pr-16">
                                {/* Company Title (h-7 approx xl font) */}
                                <Skeleton className="h-7 w-40 mb-3 bg-gray-200" />
                                {/* Meta Row */}
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-4 w-24 bg-gray-200" />
                                    <Skeleton className="h-4 w-20 bg-gray-200" />
                                </div>
                            </div>

                            {/* Right Side (Role, Desc, Stack) */}
                            <div className="pl-20 md:pl-16">
                                {/* Role Title (h-8 approx 2xl font) */}
                                <Skeleton className="h-8 w-64 mb-6 bg-gray-200" />

                                {/* Description Paragraphs */}
                                <div className="space-y-3 mb-8">
                                    <Skeleton className="h-4 w-full bg-gray-200" />
                                    <Skeleton className="h-4 w-[90%] bg-gray-200" />
                                    <Skeleton className="h-4 w-[95%] bg-gray-200" />
                                </div>

                                {/* Tech Stack Chips */}
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-6 w-16 rounded-full bg-gray-200" />
                                    <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                                    <Skeleton className="h-6 w-14 rounded-full bg-gray-200" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return <ExperiencesContent container={container} experiences={filteredExperiences} category={category} />;
}

// Content component handles the animation, now guaranteed to have a valid container
function ExperiencesContent({ container, experiences, category }: { container: HTMLElement, experiences: Experience[], category?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    // safe to useScroll here via the container prop
    const { scrollYProgress } = useScroll({
        target: containerRef,
        container: { current: container },
        offset: ["start center", "end end"]
    });

    const heightStyle = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-20" id="experiences">
            <h2 className="text-3xl font-bold text-center mb-16 tracking-tight text-gray-900">
                {category === 'education' ? 'Education' : 'Experience'}
            </h2>

            <div ref={containerRef} className="relative min-h-[200px]">
                {/* Timeline Line (Background - Gray) */}
                <div className="absolute left-8 md:left-[35%] transform -translate-x-1/2 w-[2px] h-full bg-gray-200" />

                {/* Timeline Line (Foreground - Gradient Fill) */}
                <motion.div
                    style={{ height: heightStyle }}
                    className="absolute left-8 md:left-[35%] transform -translate-x-1/2 w-[2px] bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 origin-top"
                />

                {/* Traveling Logo */}
                <motion.div
                    style={{ top: heightStyle }}
                    className="absolute left-8 md:left-[35%] transform -translate-x-1/2 -translate-y-1/2 z-20"
                >
                    <Avatar className="w-10 h-10 rounded-none bg-transparent">
                        <AvatarImage src="/avatar.png" alt="Traveler" />
                        <AvatarFallback className="bg-transparent">Ad</AvatarFallback>
                    </Avatar>
                </motion.div>

                <div className="flex flex-col gap-24">
                    {experiences.map((exp, index) => (
                        <ExperienceCard key={exp.id} experience={exp} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ExperienceCard({ experience, index }: { experience: Experience; index: number }) {
    return (
        <div className="relative grid grid-cols-1 md:grid-cols-[35%_1fr] gap-8 md:gap-0">

            {/* Timeline Node - Simple Dot */}
            <div className={`absolute left-8 md:left-[35%] transform -translate-x-1/2 -translate-y-4 md:translate-y-0 z-10 
                           flex items-center justify-center
                           ${index === 0 ? "top-0" : "top-0"} 
            `}>
                <div className="w-4 h-4 rounded-full bg-white border-4 border-gray-300" />
            </div>

            {/* Left Side (Date & Company Info) */}
            <div className={`md:text-left flex flex-col items-start md:items-start pl-20 md:pl-0 md:pr-16`}>
                <div className="sticky top-24 transition-all duration-300">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">{experience.company}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1 font-medium uppercase tracking-wide">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>{experience.date}</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span>{experience.location}</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                            <Briefcase className="w-4 h-4 shrink-0" />
                            <span>{experience.type}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side (Role & Description) - or swapped based on index if we wanted zigzag, but image shows consistent layout.
                Image shows: Company Left, Detail Right. Let's stick to that. 
             */}
            <div className="pl-20 md:pl-16 pt-2 md:pt-0">
                <h4 className="text-2xl font-bold text-gray-900 mb-6">{experience.role}</h4>

                <div className="space-y-4 text-gray-700 leading-relaxed text-[15px]">
                    {experience.description.map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>

                {/* Tech Stack Tags */}
                <div className="mt-8 flex flex-wrap gap-2">
                    {experience.tech_stack.map((tech) => (
                        <span
                            key={tech}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-xl border whitespace-normal h-auto text-left max-w-full leading-snug break-words",
                                "bg-zinc-900 text-white border-zinc-800 dark:bg-white dark:text-zinc-900"
                            )}
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
