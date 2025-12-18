"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useChat } from "@/components/chat-provider"
import { ChatIntents } from "@/lib/intents"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

const defaultImages = [
    "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1629904853716-6c29f60b4321?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
]

interface AuthorProfile {
    title: string;
    description: string;
    images: string[];
}

export const AuthorCard = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(({ className, onClick, ...props }, ref) => {
    const { startChat, sendMessage, conversationId } = useChat()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Hardcoded profile for instant rendering
    const profile: AuthorProfile = {
        title: "Author/Developer",
        description: "Learn more about the creator behind this portfolio.",
        images: defaultImages
    };

    const images = profile.images;

    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length)
        }, 3000) // Slower rotation
        return () => clearInterval(interval)
    }, [images.length])

    const handleNavClick = async (query: string, intent?: string) => {
        if (!conversationId) {
            await startChat("Guest")
        }
        sendMessage(query, intent)
    }

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) onClick(e);
        handleNavClick("Tell me about yourself.", ChatIntents.ABOUT_ME);
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
