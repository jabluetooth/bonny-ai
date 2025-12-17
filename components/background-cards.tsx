"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DraggableCardBody, DraggableCardContainer } from "@/components/ui/draggable-card";
import { cn } from "@/lib/utils";

interface BackgroundCardProps {
    title: string;
    description: string;
    image: string;
    date: string;
}

const backgroundData: BackgroundCardProps[] = [
    {
        title: "Early Beginnings",
        date: "2018 - 2020",
        description: "Started my journey exploring computer science fundamentals. Fascinated by algorithms and the potential of software to solve real-world problems. Built my first static websites and simple games.",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
    },
    {
        title: "University Years",
        date: "2020 - 2024",
        description: "Deep dived into Full Stack Development and AI. Participated in multiple hackathons, leading teams to victory. Specialized in React ecosystem and Python for data science.",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop",
    },
    {
        title: "Professional Era",
        date: "2024 - Present",
        description: "Currently working as a Senior Frontend Engineer. Focusing on building scalable web applications and integrating agents into user interfaces. Passionate about UI/UX and performance optimization.",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop",
    }
];

export function BackgroundCards() {
    return (
        <DraggableCardContainer className="py-20">
            {/* Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <h1 className="text-[120px] font-black text-slate-800/30 dark:text-slate-100/10 tracking-widest uppercase text-center select-none leading-none blur-sm">
                    Back<br />ground
                </h1>
            </div>

            {/* Stacked Cards - Reverse order to stack properly */}
            {[...backgroundData].reverse().map((item, index) => {
                // Reverse index to calculate offset correctly
                const realIndex = backgroundData.length - 1 - index;
                // Add slight random rotation for the "messy stack" look
                const randomRotate = (realIndex % 2 === 0 ? 1 : -1) * (realIndex * 2);

                return (
                    <DraggableCardBody
                        key={item.title}
                        className={cn(
                            "z-[10]",
                            // Additional styling/rotation
                        )}
                    >
                        {/* We preserve the 'Flip' logic INSIDE the draggable body */}
                        <FlippableContent item={item} />
                    </DraggableCardBody>
                )
            })}
        </DraggableCardContainer>
    );
}

function FlippableContent({ item }: { item: BackgroundCardProps }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        setLastPointerPos({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        const deltaX = Math.abs(e.clientX - lastPointerPos.x);
        const deltaY = Math.abs(e.clientY - lastPointerPos.y);

        // If moved less than 5 pixels, consider it a click
        if (deltaX < 5 && deltaY < 5) {
            setIsFlipped(!isFlipped);
        }
    };

    return (
        <motion.div
            className="w-full h-full relative group cursor-pointer"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            {/* Front Side */}
            <div
                className="absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl"
                style={{ backfaceVisibility: "hidden" }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                    <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold bg-primary/80 rounded-full backdrop-blur-sm border border-white/10">
                        {item.date}
                    </span>
                    <h3 className="text-xl font-bold leading-tight">{item.title}</h3>
                    <p className="text-sm text-gray-300 mt-1 opacity-80">Tap to flip</p>
                </div>
            </div>

            {/* Back Side */}
            <div
                className="absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-slate-900 p-6 flex flex-col justify-center items-center text-center border border-white/10 shadow-2xl"
                style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                }}
            >
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <div className="w-10 h-1 bg-primary rounded-full mb-6 mx-auto" />
                <p className="text-gray-300 leading-relaxed font-light text-sm">
                    {item.description}
                </p>
            </div>
        </motion.div>
    )
}
