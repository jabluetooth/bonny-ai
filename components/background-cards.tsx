"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DraggableCardBody, DraggableCardContainer } from "@/components/ui/draggable-card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Removed interface from here, it should be inferred or defined separately if used in multiple places.
// For now keeping local interface but removing data array.

interface BackgroundCardProps {
    id?: string;
    title: string;
    description: string;
    image: string;
    date: string;
    className?: string;
}

export function BackgroundCards() {
    const [cards, setCards] = useState<BackgroundCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    // Get last known count from localStorage, default to 3
    const getLastKnownCount = (): number => {
        if (typeof window === "undefined") return 3;
        const stored = localStorage.getItem("background_cards_count");
        return stored ? parseInt(stored, 10) : 3;
    };

    const [skeletonCount, setSkeletonCount] = useState(3);

    useEffect(() => {
        // Initialize skeleton count from localStorage on mount
        setSkeletonCount(getLastKnownCount());
    }, []);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                // Cache bust to ensure fresh data
                const res = await fetch(`/api/about/background?t=${new Date().getTime()}`);
                const json = await res.json();
                console.log("Background Cards Data:", json);

                if (json.data) {
                    // Map DB snake_case to component expected props if needed, or just use what we assume
                    // DB: date_range, class_name
                    // Component used: date, className
                    const mapped = json.data.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        image: item.image,
                        date: item.date_range, // Mapping DB column to prop
                        className: item.class_name // Mapping DB column to prop
                    }));
                    setCards(mapped);

                    // Save the count to localStorage for next load
                    localStorage.setItem("background_cards_count", String(mapped.length));
                }
            } catch (error) {
                console.error("Failed to fetch background cards:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCards();
    }, []);

    // Generate dynamic skeleton positions based on expected card count
    const generateSkeletonPositions = (count: number): string[] => {
        const positions = [
            "top-20 left-[20%] -rotate-6",
            "top-10 left-[45%] rotate-3",
            "top-32 right-[20%] -rotate-2",
            "top-40 left-[10%] rotate-4",
            "top-16 right-[35%] -rotate-3",
            "top-28 left-[60%] rotate-2"
        ];
        return positions.slice(0, Math.min(count, positions.length));
    };

    if (loading) {
        return (
            <DraggableCardContainer className="py-20 min-h-[500px] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <h1 className="text-[120px] font-black text-slate-800/30 dark:text-slate-100/10 tracking-widest uppercase text-center select-none leading-none blur-sm">
                        Back<br />ground
                    </h1>
                </div>
                {/* Dynamic Skeleton Cards */}
                {generateSkeletonPositions(skeletonCount).map((pos, i) => (
                    <DraggableCardBody key={i} className={cn("absolute z-10", pos, "pointer-events-none opacity-50 grayscale")}>
                        <div className="w-full h-full relative rounded-xl overflow-hidden bg-slate-900 shadow-2xl">
                            <Skeleton className="h-full w-full bg-slate-800" />
                        </div>
                    </DraggableCardBody>
                ))}
            </DraggableCardContainer>
        )
    }

    // Fallback if no data (e.g. table empty)
    if (cards.length === 0) {
        return <div className="py-20 text-center text-muted-foreground">No background info found.</div>;
    }

    return (
        <DraggableCardContainer className="py-20 min-h-[500px] overflow-hidden">
            {/* Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <h1 className="text-[120px] font-black text-slate-800/30 dark:text-slate-100/10 tracking-widest uppercase text-center select-none leading-none blur-sm">
                    Bonny-Ai
                </h1>
            </div>

            {/* Scattered Cards */}
            {cards.map((item, index) => {
                return (
                    <DraggableCardBody
                        key={item.id || index} // Use ID if available
                        className={cn(
                            "absolute z-[10]",
                            item.className
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
