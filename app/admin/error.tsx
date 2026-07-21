"use client";

import { useEffect } from "react";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Admin Error]", error);
    }, [error]);

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground max-w-sm text-sm">
                An error occurred in the admin panel.
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
