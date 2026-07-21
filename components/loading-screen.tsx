"use client"

const LETTERS = "BONNY-AI".split("")
const TOTAL = LETTERS.length
const DURATION = 2.4 // seconds

// Each letter occupies its own non-overlapping time slot.
// Only one letter is bright at any moment — no wave effect.
function buildKeyframes(): string {
    return LETTERS.map((_, i) => {
        const slotStart = ((i / TOTAL) * 100).toFixed(3)
        const peak      = (((i + 0.5) / TOTAL) * 100).toFixed(3)
        const slotEnd   = (((i + 1) / TOTAL) * 100).toFixed(3)
        return `@keyframes bonny-${i} {
  0%, ${slotStart}% { opacity: 0.18; }
  ${peak}%           { opacity: 1; }
  ${slotEnd}%, 100%  { opacity: 0.18; }
}`
    }).join("\n")
}

const BASE_CSS = `
.bonny-letter {
  display: inline-block;
  font-family: var(--font-mono), monospace;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1;
  opacity: 0.18;
  animation-duration: ${DURATION}s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
${buildKeyframes()}
`

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
            <div className="flex items-center text-foreground">
                {LETTERS.map((char, i) => (
                    <span
                        key={i}
                        className="bonny-letter"
                        style={{ animationName: `bonny-${i}` }}
                    >
                        {char}
                    </span>
                ))}
            </div>
        </div>
    )
}
