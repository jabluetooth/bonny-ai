"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Global Error]", error);
    }, [error]);

    return (
        <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 p-8 text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground max-w-sm">
                An unexpected error occurred. Please try again or refresh the page.
            </p>
            <button
                onClick={reset}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
                Try again
            </button>
        </div>
    );
}
