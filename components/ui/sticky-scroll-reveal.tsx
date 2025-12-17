"use client";
import React, { useRef } from "react";
import { useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
    content,
    contentClassName,
}: {
    content: {
        title: string;
        description: string;
        content?: React.ReactNode | any;
    }[];
    contentClassName?: string;
}) => {
    const [activeCard, setActiveCard] = React.useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleScroll = () => {
        if (!ref.current) return;

        const container = ref.current;
        const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;

        let closestIndex = 0;
        let minDistance = Number.MAX_VALUE;

        cardRefs.current.forEach((card, index) => {
            if (!card) return;
            const cardCenter = card.getBoundingClientRect().top + card.clientHeight / 2;
            const distance = Math.abs(containerCenter - cardCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        setActiveCard(closestIndex);
    };

    const backgroundColors = [
        "var(--slate-900)",
        "var(--black)",
        "var(--neutral-900)",
    ];

    return (
        <motion.div
            animate={{
                backgroundColor: backgroundColors[activeCard % backgroundColors.length],
            }}
            className="h-[30rem] overflow-y-auto flex justify-center relative space-x-10 rounded-3xl py-6 px-10 border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-black w-full scrollbar-hidden snap-y snap-mandatory"
            ref={ref}
            onScroll={handleScroll}
        >
            <div className="div relative flex items-start px-4">
                <div className="max-w-2xl">
                    {content.map((item, index) => (
                        <div
                            key={item.title + index}
                            className="my-10 snap-center flex flex-col justify-center min-h-[10rem]"
                            ref={(el) => {
                                cardRefs.current[index] = el;
                            }}
                        >
                            <motion.h2
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.3,
                                    y: activeCard === index ? 0 : 20,
                                }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="text-2xl font-bold text-slate-800 dark:text-slate-100"
                            >
                                {item.title}
                            </motion.h2>
                            <motion.p
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.3,
                                    y: activeCard === index ? 0 : 20,
                                }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="text-kg text-slate-600 dark:text-slate-300 max-w-sm mt-10"
                            >
                                {item.description}
                            </motion.p>
                        </div>
                    ))}
                    <div className="h-40" />
                </div>
            </div>
            <div
                className={cn(
                    "hidden lg:block h-60 w-80 rounded-md bg-white sticky top-20 overflow-hidden self-start mt-20",
                    contentClassName
                )}
            >
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={activeCard}
                        initial={{ opacity: 0, scale: 0.9, rotateX: -20, z: -100 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0, z: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotateX: 20, z: -100 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                        }}
                        className="w-full h-full flex items-center justify-center p-0 absolute inset-0"
                        style={{ perspective: "1000px" }}
                    >
                        {content[activeCard].content ?? null}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
