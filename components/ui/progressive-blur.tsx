
import { cn } from "@/lib/utils"

interface ProgressiveBlurProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: "top" | "bottom" | "left" | "right"
}

export const ProgressiveBlur = ({
    className,
    direction = "bottom",
    blurIntensity = 4,
    showBackground = false,
    gradientStart = "0%",
    ...props
}: ProgressiveBlurProps & { blurIntensity?: number; showBackground?: boolean; gradientStart?: string }) => {
    const isVertical = direction === "top" || direction === "bottom"
    const isTopOrLeft = direction === "top" || direction === "left"

    // Base gradient direction
    const gradientDir = {
        top: "to bottom",
        bottom: "to top",
        left: "to right",
        right: "to left",
    }[direction]

    // Create 4 layers of increasing blur
    // We want the blur to be solid near the edge (0%) and fade out (100%)
    const layers = [
        { blur: blurIntensity * 0.125, stop: "100%" },
        { blur: blurIntensity * 0.25, stop: "95%" },
        { blur: blurIntensity * 0.5, stop: "90%" },
        { blur: blurIntensity, stop: "85%" },
    ]

    return (
        <div
            className={cn(
                "absolute z-10 pointer-events-none user-select-none",
                // Position defaults based on direction
                direction === "top" && "inset-x-0 top-0 h-24",
                direction === "bottom" && "inset-x-0 bottom-0 h-24",
                direction === "left" && "inset-y-0 left-0 w-24",
                direction === "right" && "inset-y-0 right-0 w-24",
                className
            )}
            {...props}
        >
            {layers.map((layer, i) => (
                <div
                    key={i}
                    className="absolute inset-0 z-[1]"
                    style={{
                        backdropFilter: `blur(${layer.blur}px)`,
                        maskImage: `linear-gradient(${gradientDir}, black ${gradientStart}, transparent ${layer.stop})`
                    }}
                />
            ))}
            {showBackground && (
                <div
                    className="absolute inset-0 z-[5] bg-background/60"
                    style={{
                        maskImage: `linear-gradient(${gradientDir}, black ${gradientStart}, transparent 100%)`
                    }}
                />
            )}
        </div>
    )
}

function getOpposite(dir: string) {
    if (dir === "top") return "bottom";
    if (dir === "bottom") return "top";
    if (dir === "left") return "right";
    if (dir === "right") return "left";
    return "bottom";
}
