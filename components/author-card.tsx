"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useChat } from "@/components/chat-provider"
import { ChatIntents } from "@/lib/intents"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { createBrowserClient } from "@supabase/ssr"

interface AuthorProfile {
    title: string;
    description: string;
    images: string[];
}

export const AuthorCard = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(({ className, onClick, ...props }, ref) => {
    const { startChat, sendMessage, conversationId } = useChat()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [profile, setProfile] = useState<AuthorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data, error } = await supabase
                    .from('author_profiles')
                    .select('*')
                    .eq('is_active', true)
                    .maybeSingle();

                if (data) {
                    setProfile(data);
                }
            } catch (err) {
                console.error("Error fetching author profile:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const images = profile?.images && profile.images.length > 0
        ? profile.images
        : ["https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=800&auto=format&fit=crop"]; // Fallback

    useEffect(() => {
        if (images.length <= 1) return;

        console.log("Starting animation with", images.length, "images");

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [images])

    const handleNavClick = async (query: string, intent?: string) => {
        let activeId = conversationId;
        if (!activeId) {
            const newId = await startChat("Guest");
            if (newId) activeId = newId;
        }
        if (activeId) {
            sendMessage(query, intent, activeId);
        }
    }

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) onClick(e);
        handleNavClick("Tell me about yourself.", ChatIntents.ABOUT_ME);
    }

    if (isLoading) {
        return (
            <div className={cn("flex h-full w-full flex-col justify-end rounded-md bg-muted p-6 relative overflow-hidden", className)}>
                <Skeleton className="absolute inset-0 w-full h-full" />
                <div className="relative z-20 space-y-2">
                    <Skeleton className="h-6 w-32 bg-white/20" />
                    <Skeleton className="h-4 w-48 bg-white/20" />
                </div>
            </div>
        )
    }

    return (
        <a
            ref={ref}
            className={cn(
                "flex h-full w-full select-none flex-col justify-end rounded-md bg-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer relative overflow-hidden group",
                className
            )}
            onClick={handleClick}
            {...props}
        >
            {images.map((img, index) => (
                <div
                    key={img}
                    className={cn(
                        "absolute inset-0 transition-opacity duration-1000",
                        index === currentImageIndex ? "opacity-100" : "opacity-0"
                    )}
                >
                    <Image
                        src={img}
                        alt="Author"
                        fill
                        className="object-cover"
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 400px"
                    />
                </div>
            ))}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300 z-10" />

            <div className="relative z-20">
                <div className="mb-2 mt-4 text-lg font-medium text-white">
                    {profile?.title || "Author/Developer"}
                </div>
                <p className="text-sm leading-tight text-white/90">
                    {profile?.description || "Learn more about the creator behind this portfolio."}
                </p>
            </div>
        </a>
    )
})
AuthorCard.displayName = "AuthorCard"
