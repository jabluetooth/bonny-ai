"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Demo clips are stored as MP4/WebM; everything else is a still image. */
export function isVideoUrl(url?: string | null) {
    return !!url && /\.(mp4|webm)(\?|#|$)/i.test(url);
}

/**
 * A project's picture or demo clip, filling its (relatively positioned)
 * parent. Clips are muted loops that only play while on screen, and stay
 * on their first frame for visitors who ask for reduced motion.
 */
export function ProjectMedia({
    src,
    alt = "",
    sizes,
    className,
    priority,
    still,
}: {
    src: string;
    /** Empty for decorative use next to a visible title. */
    alt?: string;
    sizes: string;
    className?: string;
    priority?: boolean;
    /** Never play, just show the first frame (tiny thumbnails). */
    still?: boolean;
}) {
    const ref = useRef<HTMLVideoElement>(null);
    const video = isVideoUrl(src);

    useEffect(() => {
        const el = ref.current;
        if (!el || still) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) el.play().catch(() => {});
                else el.pause();
            },
            { threshold: 0.25 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [still, src]);

    if (!video) {
        return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover object-top", className)} />;
    }

    return (
        <video
            ref={ref}
            // #t nudges Safari into painting the first frame before playback.
            src={`${src}#t=0.001`}
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            aria-hidden={alt ? undefined : true}
            aria-label={alt || undefined}
            role={alt ? "img" : undefined}
            className={cn("absolute inset-0 h-full w-full object-cover object-top", className)}
        />
    );
}
