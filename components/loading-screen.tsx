"use client"

const LETTERS = "BONNY-AI".split("")

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
            <style jsx global>{`
                .bonny-letter {
                    display: inline-block;
                    font-size: clamp(2rem, 6vw, 3rem);
                    font-family: var(--font-mono), monospace;
                    font-weight: 700;
                    line-height: 1;
                    -webkit-text-fill-color: transparent;
                    -webkit-text-stroke: 1.5px var(--foreground);
                    background-image: linear-gradient(var(--foreground), var(--foreground));
                    background-position: left center;
                    background-size: 0% 100%;
                    background-repeat: no-repeat;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: bonny-letter-fill 3s ease-in-out infinite;
                }
                @keyframes bonny-letter-fill {
                    0%    { background-size: 0%   100%; }
                    22%   { background-size: 100% 100%; }
                    50%   { background-size: 100% 100%; }
                    72%   { background-size: 0%   100%; }
                    100%  { background-size: 0%   100%; }
                }
            `}</style>
            <div className="flex items-center tracking-widest">
                {LETTERS.map((char, i) => (
                    <span
                        key={i}
                        className="bonny-letter"
                        style={{ animationDelay: `${i * 0.13}s` }}
                    >
                        {char}
                    </span>
                ))}
            </div>
        </div>
    )
}
