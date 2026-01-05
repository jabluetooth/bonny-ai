"use client"

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
            <style jsx global>{`
                .loader {
                    width: fit-content;
                    font-size: 40px;
                    font-family: var(--font-mono), monospace;
                    font-weight: bold;
                    text-transform: uppercase;
                    color: #0000;
                    -webkit-text-stroke: 1px currentColor;
                    background: conic-gradient(currentColor 0 0) 0/0 100% no-repeat text;
                    animation: l11 2s steps(8, jump-none) infinite;
                }
                /* Use currentColor so it adapts to dark/light mode automatically */
                .loader {
                    color: transparent;
                    -webkit-text-stroke: 1px var(--foreground);
                    background: linear-gradient(var(--foreground) 0 0) 0/0 100% no-repeat text;
                    -webkit-background-clip: text;
                    background-clip: text;
                }
                .loader:before {
                    content: "BONNY-AI";
                }
                @keyframes l11 {
                    to { background-size: 100% 100% }
                }
                /* Dark mode adjustment if needed, but using var(--foreground) handles it mostly */
            `}</style>
            <div className="loader text-foreground"></div>
        </div>
    )
}
