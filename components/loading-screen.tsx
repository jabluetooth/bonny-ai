"use client"

const LETTERS = "BONNY-AI".split("")
const TOTAL = LETTERS.length
const DURATION = 2.4 // seconds — 0.3s per letter

// Each letter gets its own keyframe that is active only during its time slot.
// This ensures exactly one letter is filling/draining at any moment.
function buildKeyframes(): string {
    return LETTERS.map((_, i) => {
        const slotStart = ((i / TOTAL) * 100).toFixed(3)
        const fillEnd   = (((i + 0.4) / TOTAL) * 100).toFixed(3)
        const holdEnd   = (((i + 0.6) / TOTAL) * 100).toFixed(3)
        const slotEnd   = (((i + 1)   / TOTAL) * 100).toFixed(3)
        return `
@keyframes bonny-fill-${i} {
  0%, ${slotStart}% { background-size: 0% 100%; }
  ${fillEnd}%        { background-size: 100% 100%; }
  ${holdEnd}%        { background-size: 100% 100%; }
  ${slotEnd}%, 100%  { background-size: 0% 100%; }
}`
    }).join("\n")
}

const KEYFRAMES = buildKeyframes()

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
                    letter-spacing: 0.08em;
                    -webkit-text-fill-color: transparent;
                    -webkit-text-stroke: 1.5px var(--foreground);
                    background-image: linear-gradient(var(--foreground), var(--foreground));
                    background-position: left center;
                    background-size: 0% 100%;
                    background-repeat: no-repeat;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation-duration: ${DURATION}s;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                ${KEYFRAMES}
            `}</style>
            <div className="flex items-center">
                {LETTERS.map((char, i) => (
                    <span
                        key={i}
                        className="bonny-letter"
                        style={{ animationName: `bonny-fill-${i}` }}
                    >
                        {char}
                    </span>
                ))}
            </div>
        </div>
    )
}
