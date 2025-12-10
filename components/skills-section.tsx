"use client";

import { cn } from "@/lib/utils";
import Marquee from "@/components/ui/marquee";
import { Separator } from "@/components/ui/separator";
import { Cpu, Globe, Database, Palette, Users } from "lucide-react";

const skillCategories = [
    {
        title: "Frontend Development",
        skills: [
            "HTML", "CSS", "JavaScript/TypeScript", "Tailwind CSS", "Bootstrap", "Next.js", "React", "Vercel AI SDK", "Gsap", "Framer Motion"
        ]
    },
    {
        title: "Backend Development",
        skills: [
            "Node.js", "Express", "PostgreSQL", "Supabase", "Python", "Django", "Firebase", "REST APIs"
        ]
    },
    {
        title: "Design & Tools",
        skills: [
            "Figma", "Adobe XD", "Blender", "Git", "VS Code", "Postman"
        ]
    },
    {
        title: "Soft Skills",
        skills: [
            "Communication", "Team Leadership", "Problem Solving", "Agile Methodology", "Remote Collaboration"
        ]
    }
];

// Combine logs/icons for the Marquee (Highlights)
const marqueeSkills = [
    { name: "React", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" },
    { name: "Next.js", img: "https://assets.vercel.com/image/upload/v1607554385/repositories/next-js/next-js.png" },
    { name: "TypeScript", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/1200px-Typescript_logo_2020.svg.png" },
    { name: "Node.js", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1200px-Node.js_logo.svg.png" },
    { name: "Supabase", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Supabase_logo.svg/1200px-Supabase_logo.svg.png" },
    { name: "Tailwind", img: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" },
    { name: "Python", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1200px-Python-logo-notext.svg.png" },
    { name: "Figma", img: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" },
];

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
                "relative w-16 h-16 cursor-pointer overflow-hidden rounded-xl border p-2",
                "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
                "flex items-center justify-center"
            )}
        >
            <img className="h-10 w-10 object-contain" alt={name} src={img} />
        </figure>
    );
};

export function SkillsSection() {
    return (
        <div className="w-full max-w-full min-w-0 flex flex-col gap-2 p-2 rounded-xl border border-border/40 bg-card/50 shadow-sm animate-in fade-in slide-in-from-bottom-2">

            {/* 1. Highlights Marquee */}
            <div className="w-full max-w-full relative overflow-hidden">
                <div className="absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
                <div className="absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />
                <Marquee pauseOnHover className="[--duration:30s]">
                    {marqueeSkills.map((skill) => (
                        <SkillCard key={skill.name} {...skill} />
                    ))}
                </Marquee>
            </div>
            {/* 2. Static Categories (Pill/Tag style) */}
            <div className="flex flex-col gap-5 w-full max-w-full min-w-0 overflow-hidden">
                {skillCategories.map((group, idx) => (
                    <div key={group.title} className="flex flex-col gap-3 max-w-full min-w-0">
                        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                            {idx === 0 && <Globe className="w-4 h-4 text-current" />}
                            {idx === 1 && <Cpu className="w-4 h-4 text-current" />}
                            {idx === 2 && <Palette className="w-4 h-4 text-current" />}
                            {idx === 3 && <Users className="w-4 h-4 text-current" />}
                            {group.title}
                        </div>
                        <div className="flex flex-wrap gap-2 max-w-full">
                            {group.skills.map(skill => (
                                <span
                                    key={skill}
                                    className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-xl shadow-sm border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-default dark:bg-white dark:text-zinc-900 whitespace-normal h-auto text-left max-w-full leading-snug break-words"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
