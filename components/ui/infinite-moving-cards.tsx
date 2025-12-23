"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { WobbleCard } from "./wobble-card";

export const InfiniteMovingCards = ({
    items,
    direction = "left",
    speed = "fast",
    pauseOnHover = true,
    className,
    startAnimation, // Add to destructuring
}: {
    items: {
        quote: string;
        name: string;
        title: string;
    }[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
    startAnimation?: boolean; // New prop for manual control
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollerRef = React.useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (items.length > 0) {
            addAnimation();
        }
    }, [items]);

    const [internalStart, setInternalStart] = useState(false);

    // Use prop if provided, otherwise internal state
    const isStarted = startAnimation !== undefined ? startAnimation : internalStart;

    function addAnimation() {
        if (containerRef.current && scrollerRef.current && items.length > 0) {
            const scrollerContent = Array.from(scrollerRef.current.children);

            // Prevent duplicate cloning if already cloned (simple check: if children > items)
            if (scrollerRef.current.children.length > items.length) {
                // Already cloned? Or we could clear and re-clone. 
                // For safety with async data, let's just proceed if not started.
                if (isStarted) return;
            }

            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                if (scrollerRef.current) {
                    scrollerRef.current.appendChild(duplicatedItem);
                }
            });

            getDirection();
            getSpeed();
            setInternalStart(true);
        }
    }

    const getDirection = () => {
        if (containerRef.current) {
            if (direction === "left") {
                containerRef.current.style.setProperty(
                    "--animation-direction",
                    "forwards"
                );
            } else {
                containerRef.current.style.setProperty(
                    "--animation-direction",
                    "reverse"
                );
            }
        }
    };

    const getSpeed = () => {
        if (containerRef.current) {
            if (speed === "fast") {
                containerRef.current.style.setProperty("--animation-duration", "20s");
            } else if (speed === "normal") {
                containerRef.current.style.setProperty("--animation-duration", "40s");
            } else {
                containerRef.current.style.setProperty("--animation-duration", "80s");
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "scroller relative z-20  max-w-7xl overflow-hidden pointer-events-none",
                className
            )}
        >
            <ul
                ref={scrollerRef}
                className={cn(
                    " flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
                    isStarted && "animate-scroll ",
                    pauseOnHover && "hover:[animation-play-state:paused]"
                )}
            >
                {items.map((item, idx) => (
                    <li
                        className="w-[280px] max-w-full relative rounded-2xl flex-shrink-0 md:w-[320px] min-h-[200px] pointer-events-auto"
                        key={item.name + idx}
                    >
                        <WobbleCard containerClassName="h-full bg-slate-900 border border-slate-700" className="p-6">
                            <blockquote>
                                <div
                                    aria-hidden="true"
                                    className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
                                ></div>
                                <span className=" relative z-20 text-sm leading-snug text-gray-100 font-normal">
                                    {item.quote}
                                </span>
                                <div className="relative z-20 mt-4 flex flex-row items-center">
                                    <span className="flex flex-col gap-1">
                                        <span className=" text-sm leading-snug text-gray-400 font-normal">
                                            {item.name}
                                        </span>
                                        <span className=" text-sm leading-snug text-gray-400 font-normal">
                                            {item.title}
                                        </span>
                                    </span>
                                </div>
                            </blockquote>
                        </WobbleCard>
                    </li>
                ))}
            </ul>
        </div>
    );
};
