"use client";

import { useEffect } from "react";

export function DisableDevTools() {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === "F12") {
                e.preventDefault();
                e.stopPropagation();
            }

            // Ctrl+Shift+I (DevTools)
            // Ctrl+Shift+J (Console)
            // Ctrl+Shift+C (Inspect Element)
            if (
                e.ctrlKey &&
                e.shiftKey &&
                ["I", "J", "C", "i", "j", "c"].includes(e.key)
            ) {
                e.preventDefault();
                e.stopPropagation();
            }

            // Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);

    return null;
}
