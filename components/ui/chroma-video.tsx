"use client";

import { useRef, useEffect, useState } from "react";

interface ChromaVideoProps {
    src: string;
    poster?: string;
    className?: string;
    similarity?: number; // 0-100, how close to green (default 28)
    smoothness?: number; // 0-100, edge feathering (default 10)
    greenColor?: { r: number; g: number; b: number }; // Target green color (0-255)
    maxResolution?: number; // Max canvas dimension in pixels (reduces quality to match smaller displays)
}

// WebGL shader for GPU-accelerated chroma keying
const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform vec3 u_keyColor;
    uniform float u_similarity;
    uniform float u_smoothness;
    varying vec2 v_texCoord;

    void main() {
        vec4 color = texture2D(u_texture, v_texCoord);

        // Calculate distance from key color
        float dist = distance(color.rgb, u_keyColor);

        // Apply chroma key with smoothness
        float alpha = 1.0;
        if (dist < u_similarity) {
            alpha = 0.0;
        } else if (dist < u_similarity + u_smoothness) {
            alpha = (dist - u_similarity) / u_smoothness;
        }

        gl_FragColor = vec4(color.rgb, color.a * alpha);
    }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

export function ChromaVideo({
    src,
    poster,
    className,
    similarity = 35,
    smoothness = 30,
    greenColor = { r: 0, g: 255, b: 0 },
    maxResolution,
}: ChromaVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    // Helper to calculate capped dimensions while maintaining aspect ratio
    const getCanvasSize = (videoWidth: number, videoHeight: number) => {
        if (!maxResolution || (videoWidth <= maxResolution && videoHeight <= maxResolution)) {
            return { width: videoWidth || 320, height: videoHeight || 320 };
        }
        const aspect = videoWidth / videoHeight;
        if (videoWidth > videoHeight) {
            return { width: maxResolution, height: Math.round(maxResolution / aspect) };
        } else {
            return { width: Math.round(maxResolution * aspect), height: maxResolution };
        }
    };

    // Depend on the colour's numbers, not the object: callers pass an inline
    // literal, and a new object on every render used to tear the whole GL
    // pipeline down and rebuild it on each keystroke in the chat input.
    const keyR = greenColor.r;
    const keyG = greenColor.g;
    const keyB = greenColor.b;

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true });
        if (!gl) return; // No WebGL: the poster (if any) stays visible.
        glRef.current = gl;

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vertexShader || !fragmentShader) return;
        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) return;
        programRef.current = program;
        gl.useProgram(program);

        // Full-screen quad
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW);
        const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        const texture = gl.createTexture();
        textureRef.current = texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.uniform3f(gl.getUniformLocation(program, "u_keyColor"), keyR / 255, keyG / 255, keyB / 255);
        gl.uniform1f(gl.getUniformLocation(program, "u_similarity"), (similarity / 100) * 1.732); // max RGB distance is sqrt(3)
        gl.uniform1f(gl.getUniformLocation(program, "u_smoothness"), (smoothness / 100) * 0.5);

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let running = false;
        let disposed = false;
        let readyReported = false;
        let rafId: number | null = null;
        let vfcId: number | null = null;
        // requestVideoFrameCallback draws once per decoded frame (~30/s)
        // instead of once per display frame (60+/s). Fall back to rAF.
        const hasVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

        const draw = () => {
            if (video.readyState < 2) return;
            const size = getCanvasSize(video.videoWidth, video.videoHeight);
            if (canvas.width !== size.width || canvas.height !== size.height) {
                canvas.width = size.width;
                canvas.height = size.height;
                gl.viewport(0, 0, canvas.width, canvas.height);
            }
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            if (!readyReported) {
                readyReported = true;
                setIsVideoReady(true);
            }
        };

        const tick = () => {
            if (!running || disposed) return;
            draw();
            if (hasVFC) vfcId = video.requestVideoFrameCallback(tick);
            else rafId = requestAnimationFrame(tick);
        };

        // Exactly one loop at a time, however many media events fire.
        const start = () => {
            if (running || disposed) return;
            running = true;
            tick();
        };
        const stop = () => {
            running = false;
            if (rafId !== null) cancelAnimationFrame(rafId);
            if (vfcId !== null && hasVFC) video.cancelVideoFrameCallback(vfcId);
            rafId = vfcId = null;
        };

        const onPlaying = () => start();
        const onPause = () => stop();
        // Reduced motion: show one keyed still frame instead of a loop.
        const onLoaded = () => {
            draw();
            if (reduceMotion) video.pause();
        };

        video.addEventListener("playing", onPlaying);
        video.addEventListener("pause", onPause);
        video.addEventListener("loadeddata", onLoaded);
        if (video.readyState >= 2) onLoaded();

        // Only play while on screen.
        const observer = new IntersectionObserver(([entry]) => {
            if (reduceMotion) return;
            if (entry.isIntersecting) video.play().catch(() => { /* autoplay blocked; stays on poster */ });
            else video.pause();
        });
        observer.observe(canvas);

        if (!reduceMotion) video.play().catch(() => { /* autoplay blocked */ });
        if (!video.paused) start();

        return () => {
            disposed = true;
            stop();
            observer.disconnect();
            video.removeEventListener("playing", onPlaying);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("loadeddata", onLoaded);
            gl.deleteTexture(texture);
            gl.deleteBuffer(positionBuffer);
            gl.deleteBuffer(texCoordBuffer);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            setIsVideoReady(false);
        };
        // getCanvasSize only reads maxResolution, which is listed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [similarity, smoothness, keyR, keyG, keyB, maxResolution]);

    return (
        <div className={className} style={{ position: "relative" }}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                preload="auto"
                aria-hidden="true"
                loop
                muted
                playsInline
                style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
            />
            {/* Poster fallback - shown until video is ready */}
            {poster && !isVideoReady && (
                // Tiny static fallback shown only until the first frame draws.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={poster}
                    alt=""
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                    }}
                />
            )}
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: isVideoReady ? 1 : 0,
                    transition: "opacity 0.2s ease-in-out",
                }}
            />
        </div>
    );
}
