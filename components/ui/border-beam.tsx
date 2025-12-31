"use client"

import { motion, MotionStyle, Transition } from "motion/react"

import { cn } from "@/lib/utils"

interface BorderBeamProps {
    /**
     * The size of the border beam.
     */
    size?: number
    /**
     * The duration of the border beam.
     */
    duration?: number
    /**
     * The delay of the border beam.
     */
    delay?: number
    /**
     * The color of the border beam from.
     */
    colorFrom?: string
    /**
     * The color of the border beam to.
     */
    colorTo?: string
    /**
     * The motion transition of the border beam.
     */
    transition?: Transition
    /**
     * The class name of the border beam.
     */
    className?: string
    /**
     * The style of the border beam.
     */
    style?: React.CSSProperties
    /**
     * Whether to reverse the animation direction.
     */
    reverse?: boolean
    /**
     * The initial offset position (0-100).
     */
    initialOffset?: number
    /**
     * The border width of the beam.
     */
    borderWidth?: number
    /**
     * The corner radius of the beam path.
     */
    radius?: number
}

export const BorderBeam = ({
    className,
    size = 50,
    delay = 0,
    duration = 6,
    colorFrom = "#ffaa40",
    colorTo = "#9c40ff",
    transition,
    style,
    reverse = false,
    initialOffset = 0,
    borderWidth = 1,
    radius = 0,
}: BorderBeamProps) => {
    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0 border-transparent [mask-image:linear-gradient(white,white),linear-gradient(white,white)] [mask-composite:exclude] [mask-clip:padding-box,border-box]",
                className
            )}
            style={
                {
                    borderWidth: borderWidth,
                    borderRadius: `${radius}px`, // Explicitly set radius to match path
                    "--border-beam-width": `${borderWidth}px`,
                } as React.CSSProperties
            }
        >
            <motion.div
                className={cn(
                    "absolute h-[15px]",
                    "bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent"
                )}
                style={
                    {
                        width: size,
                        offsetPath: `rect(0 100% 100% 0 round ${radius}px)`, // Explicit dimensions
                        offsetAnchor: "50% 50%", // explicitly center
                        "--color-from": colorFrom,
                        "--color-to": colorTo,
                        ...style,
                    } as MotionStyle
                }
                initial={{ offsetDistance: `${initialOffset}%` }}
                animate={{
                    offsetDistance: reverse
                        ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
                        : [`${initialOffset}%`, `${100 + initialOffset}%`],
                }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration,
                    delay: -delay,
                    ...transition,
                }}
            />
        </div>
    )
}
