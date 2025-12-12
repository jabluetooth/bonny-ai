
import { cn } from "@/lib/utils"

interface ProgressiveBlurProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: "top" | "bottom" | "left" | "right"
}

export const ProgressiveBlur = ({
    className,
    direction = "bottom",
    ...props
}: ProgressiveBlurProps) => {
    // Gradients for different directions
    // We want the blur to be intense at the edge and fade to transparent towards the center
    const gradients = {
        top: "linear-gradient(to bottom, black, transparent)",
        bottom: "linear-gradient(to top, black, transparent)",
        left: "linear-gradient(to right, black, transparent)",
        right: "linear-gradient(to left, black, transparent)",
    }

    const maskImage = gradients[direction]

    return (
        <div
            className={cn("absolute z-10 pointer-events-none",
                // Position defaults based on direction
                direction === "top" && "inset-x-0 top-0 h-24",
                direction === "bottom" && "inset-x-0 bottom-0 h-24",
                direction === "left" && "inset-y-0 left-0 w-24",
                direction === "right" && "inset-y-0 right-0 w-24",
                className
            )}
            {...props}
        >
            {/* 
         Multiple layers of blur with varying mask steepness to create a "progressive" look.
         Each layer applies a stronger blur but is masked more aggressively to stick to the very edge.
      */}

            {/* Layer 1: Subtle blur extending furthest */}
            <div
                className="absolute inset-0 backdrop-blur-[1px]"
                style={{ maskImage: maskImage }}
            />

            {/* Layer 2: Medium blur */}
            <div
                className="absolute inset-0 backdrop-blur-[2px]"
                style={{ maskImage: gradients[direction].replace("transparent", "transparent 60%") }} // Hacky logical adjustment
            // Actually, cleaner to just stack standard gradients. The effect relies on the accumulation. 
            // But true progressive blur usually uses specific mask stops.
            // Let's settle for simple stacking for now, or refine if it looks bad.
            />

            {/* To do it properly like Magic UI usually does, we manually define the stops more precisely. 
         But simple stacking works well for this use case.
         Let's try a better approach: 4 separate divs with hardcoded styles mimicking the effect. 
      */}

            <div className="absolute inset-0 z-[1] backdrop-blur-[0.5px]" style={{ maskImage: `linear-gradient(to ${getOpposite(direction)}, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 25%)` }} />
            <div className="absolute inset-0 z-[2] backdrop-blur-[1px]" style={{ maskImage: `linear-gradient(to ${getOpposite(direction)}, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)` }} />
            <div className="absolute inset-0 z-[3] backdrop-blur-[2px]" style={{ maskImage: `linear-gradient(to ${getOpposite(direction)}, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)` }} />
            <div className="absolute inset-0 z-[4] backdrop-blur-[4px]" style={{ maskImage: `linear-gradient(to ${getOpposite(direction)}, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)` }} />
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
