"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
    text: string;
    duration?: number;
    className?: string;
    onComplete?: () => void;
}

export function TypingAnimation({ text, duration = 50, className, onComplete }: TypingAnimationProps) {
    const [displayedText, setDisplayedText] = useState("");
    const onCompleteRef = useRef(onComplete);

    // Keep ref current without adding onComplete to the main effect's deps
    useEffect(() => {
        onCompleteRef.current = onComplete;
    });

    useEffect(() => {
        if (!text) {
            setDisplayedText("");
            return;
        }

        setDisplayedText("");
        let index = 0;

        const interval = setInterval(() => {
            index++;
            setDisplayedText(text.slice(0, index));
            if (index >= text.length) {
                clearInterval(interval);
                onCompleteRef.current?.();
            }
        }, duration);

        return () => clearInterval(interval);
    }, [text, duration]);

    return <span className={cn(className)}>{displayedText}</span>;
}
