"use client";

import React, { useEffect, useState } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export function VisionSection() {
    const [topRow, setTopRow] = useState<any[]>([]);
    const [bottomRow, setBottomRow] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/about/vision');
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) {
                        setTopRow(json.data.filter((item: any) => item.row_position === 'top'));
                        setBottomRow(json.data.filter((item: any) => item.row_position === 'bottom'));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch vision cards", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) return null;

    return (
        <>
            <InfiniteMovingCards
                items={topRow}
                direction="right"
                speed="slow"
                className="-my-2"
            />
            <InfiniteMovingCards
                items={bottomRow}
                direction="left"
                speed="slow"
                className="-my-2"
            />
        </>
    );
}
