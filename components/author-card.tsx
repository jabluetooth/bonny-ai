"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useChat } from "@/components/chat-provider"
import { ChatIntents } from "@/lib/intents"

const AUTHOR_IMAGES = [
    "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=2670&auto=format&fit=crop", // Code
    "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2531&auto=format&fit=crop", // Developer
    "https://images.unsplash.com/photo-1629904853716-6c29f60b4321?q=80&w=2668&auto=format&fit=crop", // Tech
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop", // Team
]

export const AuthorCard = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(({ className, onClick, ...props }, ref) => {
    const { startChat, sendMessage, conversationId } = useChat()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % AUTHOR_IMAGES.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

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
                "flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer relative overflow-hidden group",
                className
            )}
            onClick={handleClick}
            {...props}
        >
            {AUTHOR_IMAGES.map((img, index) => (
                <div
                    key={img}
                    className={cn(
                        "absolute inset-0 bg-cover bg-center transition-opacity duration-1000",
                        index === currentImageIndex ? "opacity-100" : "opacity-0"
                    )}
                    style={{ backgroundImage: `url(${img})` }}
                />
            ))}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

            <div className="relative z-10">
                <div className="mb-2 mt-4 text-lg font-medium text-white">
                    Author/Developer
                </div>
                <p className="text-sm leading-tight text-white/90">
                    Learn more about the creator behind this portfolio.
                </p>
            </div>
        </a>
    )
})
AuthorCard.displayName = "AuthorCard"
