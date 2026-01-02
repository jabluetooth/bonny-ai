"use client";
import React from "react";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";

const gradients = [
    "linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))",
    "linear-gradient(to bottom right, var(--pink-500), var(--indigo-500))",
    "linear-gradient(to bottom right, var(--orange-500), var(--yellow-500))",
    "linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))",
];

export function InterestsSection() {
    const [content, setContent] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchInterests() {
            try {
                const res = await fetch('/api/about/interests');
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) {
                        const mapped = json.data.map((item: any, index: number) => ({
                            title: item.title,
                            description: item.description,
                            content: (
                                <div className="h-full w-full flex items-center justify-center text-white relative">
                                    <div
                                        className="absolute inset-0 opacity-20"
                                        style={{ background: gradients[index % gradients.length] }}
                                    />
                                    <img
                                        src={item.image_url}
                                        className="h-full w-full object-cover"
                                        alt={item.title}
                                    />
                                </div>
                            )
                        }));
                        setContent(mapped);
                    }
                }
            } catch (error) {
                console.error("Failed to load interests", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchInterests();
    }, []);

    if (isLoading) return null; // Or a skeleton if preferred
    if (content.length === 0) return null;

    return (
        <StickyScroll content={content} />
    );
}
