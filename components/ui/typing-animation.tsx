"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
    text: string;
    duration?: number;
    className?: string;
    onComplete?: () => void;
}

export function TypingAnimation({
    text,
    duration = 50,
    className,
    onComplete,
}: TypingAnimationProps) {
    const [displayedText, setDisplayedText] = useState<string>("");
    const [i, setI] = useState<number>(0);

    useEffect(() => {
        // Reset if text changes significantly (e.g. reused component)
        // But for chat, usually it mounts once.
        // If we want typing effect, we start interval.

        // Safety check
        if (!text) return;

        const typingEffect = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prevState) => prevState + text.charAt(i));
                setI((prevI) => prevI + 1);
            } else {
                clearInterval(typingEffect);
                if (onComplete) onComplete();
            }
        }, duration);

        return () => {
            clearInterval(typingEffect);
        };
    }, [duration, i, text, onComplete]);

    return (
        <span
            className={cn(className)}
        >
            {displayedText}
        </span>
    );
}
