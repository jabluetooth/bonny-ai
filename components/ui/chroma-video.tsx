"use client";

import { useRef, useEffect } from "react";

interface ChromaVideoProps {
    src: string;
    poster?: string;
    className?: string;
    similarity?: number; // 0-100, how close to green (default 28)
    smoothness?: number; // 0-100, edge feathering (default 10)
    greenColor?: { r: number; g: number; b: number }; // Target green color
}

export function ChromaVideo({
    src,
    poster,
    className,
    similarity = 28,
    smoothness = 10,
    greenColor = { r: 0, g: 255, b: 0 },
}: ChromaVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        // Convert similarity/smoothness from 0-100 to usable values
        const similarityThreshold = (similarity / 100) * 442; // Max distance in RGB space is ~442
        const smoothnessRange = (smoothness / 100) * 100;

        const processFrame = () => {
            if (video.paused || video.ended) {
                animationRef.current = requestAnimationFrame(processFrame);
                return;
            }

            // Match canvas size to video
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth || 80;
                canvas.height = video.videoHeight || 80;
            }

            // Draw current frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Process each pixel
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Calculate distance from target green color
                const distance = Math.sqrt(
                    Math.pow(r - greenColor.r, 2) +
                    Math.pow(g - greenColor.g, 2) +
                    Math.pow(b - greenColor.b, 2)
                );

                // Apply chroma key with smoothness
                if (distance < similarityThreshold) {
                    // Fully transparent
                    data[i + 3] = 0;
                } else if (distance < similarityThreshold + smoothnessRange) {
                    // Smooth transition (feathering)
                    const alpha = ((distance - similarityThreshold) / smoothnessRange) * 255;
                    data[i + 3] = Math.min(255, alpha);
                }
                // else: keep original alpha (fully opaque)
            }

            ctx.putImageData(imageData, 0, 0);
            animationRef.current = requestAnimationFrame(processFrame);
        };

        const handlePlay = () => {
            processFrame();
        };

        const handleLoadedData = () => {
            canvas.width = video.videoWidth || 80;
            canvas.height = video.videoHeight || 80;
            // Draw first frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        };

        video.addEventListener("play", handlePlay);
        video.addEventListener("loadeddata", handleLoadedData);

        // Start processing if video is already playing
        if (!video.paused) {
            processFrame();
        }

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("loadeddata", handleLoadedData);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [similarity, smoothness, greenColor]);

    return (
        <div className={className} style={{ position: "relative" }}>
            {/* Hidden video element */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay
                loop
                muted
                playsInline
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
            />
            {/* Visible canvas with transparency */}
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
        </div>
    );
}
