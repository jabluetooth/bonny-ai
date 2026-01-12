"use client";

import { useRef, useEffect } from "react";

interface ChromaVideoProps {
    src: string;
    poster?: string;
    className?: string;
    similarity?: number; // 0-100, how close to green (default 28)
    smoothness?: number; // 0-100, edge feathering (default 10)
    greenColor?: { r: number; g: number; b: number }; // Target green color (0-255)
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
    similarity = 28,
    smoothness = 10,
    greenColor = { r: 0, g: 255, b: 0 },
}: ChromaVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Initialize WebGL
        const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true });
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }
        glRef.current = gl;

        // Create shaders
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vertexShader || !fragmentShader) return;

        // Create program
        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) return;
        programRef.current = program;
        gl.useProgram(program);

        // Set up geometry (full-screen quad)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set up texture coordinates
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 1, 1, 1, 0, 0,
            0, 0, 1, 1, 1, 0,
        ]), gl.STATIC_DRAW);

        const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // Create texture
        const texture = gl.createTexture();
        textureRef.current = texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Convert parameters
        const similarityNorm = (similarity / 100) * 1.732; // Max RGB distance is sqrt(3)
        const smoothnessNorm = (smoothness / 100) * 0.5;

        // Set uniforms
        const keyColorLocation = gl.getUniformLocation(program, "u_keyColor");
        const similarityLocation = gl.getUniformLocation(program, "u_similarity");
        const smoothnessLocation = gl.getUniformLocation(program, "u_smoothness");

        gl.uniform3f(keyColorLocation, greenColor.r / 255, greenColor.g / 255, greenColor.b / 255);
        gl.uniform1f(similarityLocation, similarityNorm);
        gl.uniform1f(smoothnessLocation, smoothnessNorm);

        const render = () => {
            if (!video.paused && !video.ended && video.readyState >= 2) {
                // Update canvas size if needed
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth || 320;
                    canvas.height = video.videoHeight || 320;
                    gl.viewport(0, 0, canvas.width, canvas.height);
                }

                // Upload video frame to texture
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

                // Clear and draw
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
            animationRef.current = requestAnimationFrame(render);
        };

        const handleCanPlay = () => {
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 320;
            gl.viewport(0, 0, canvas.width, canvas.height);
            render();
        };

        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("playing", handleCanPlay);

        // Start if already ready
        if (video.readyState >= 3) {
            handleCanPlay();
        }

        // iOS autoplay workaround - try to play on load
        video.play().catch(() => {
            // Autoplay blocked - will start on user interaction
        });

        return () => {
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("playing", handleCanPlay);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [similarity, smoothness, greenColor]);

    return (
        <div className={className} style={{ position: "relative" }}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay
                loop
                muted
                playsInline
                style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
            />
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
        </div>
    );
}
