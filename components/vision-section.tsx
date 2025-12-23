"use client";

import React, { useEffect, useState } from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function VisionSection() {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/about/vision');
                const json = await res.json();

                if (json.data) {
                    setItems(json.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className={cn("h-64 rounded-2xl", i === 0 || i === 3 ? "md:col-span-2" : "")} />
                ))}
            </div>
        );
    }

    if (!items.length) return null;

    return (
        <BentoGrid className="max-w-7xl mx-auto md:auto-rows-[25rem]">
            {items.map((item, i) => (
                <BentoGridItem
                    key={i}
                    className={cn(
                        // Create a pattern: Items 0, 3, 6... span 2 columns
                        (i === 3 || i === 6) ? "md:col-span-2" : "md:col-span-1",
                        i === 0 ? "md:col-span-2" : ""
                    )}
                    title={item.quote}
                    description={
                        <span className="text-sm">
                            {item.name} <span className="text-neutral-500">— {item.title}</span>
                        </span>
                    }
                    header={
                        item.image_url ? (
                            <img
                                src={item.image_url}
                                alt={item.name}
                                className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl object-cover"
                            />
                        ) : (
                            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 object-cover" />
                        )
                    }
                    icon={<QuoteIcon className="h-4 w-4 text-neutral-500" />}
                />
            ))}
        </BentoGrid>
    );
}

const QuoteIcon = ({ className }: { className?: string }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2.5 2h-.5z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2.5 2h-.5z" /></svg>
    );
};
