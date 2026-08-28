import type { LangfuseSpanProcessor as LangfuseSpanProcessorType } from '@langfuse/otel'

// Populated by register() below, node runtime only. Route handlers import
// this to flush pending spans before a serverless invocation ends (see
// next/server's after()) — OTel's batching would otherwise drop them.
export let langfuseSpanProcessor: LangfuseSpanProcessorType | undefined

export async function register() {
    // Next.js calls register() for both the Node.js and Edge runtimes.
    // @opentelemetry/sdk-node depends on Node APIs (fs, net, ...) that don't
    // exist under Edge, so it must only ever load there.
    if (process.env.NEXT_RUNTIME !== 'nodejs') return

    if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) {
        console.warn('[instrumentation] LANGFUSE_SECRET_KEY/LANGFUSE_PUBLIC_KEY not set — Langfuse tracing disabled')
        return
    }

    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { LangfuseSpanProcessor } = await import('@langfuse/otel')

    langfuseSpanProcessor = new LangfuseSpanProcessor({
        // Vercel functions can freeze/exit right after a response is sent, so
        // "batched" (the default, built for long-running processes) risks
        // losing whatever hasn't flushed yet. "immediate" exports each span
        // as it ends instead — the officially recommended mode for
        // short-lived/serverless runtimes. forceFlush() calls in the route
        // handlers stay as a second line of defense for in-flight requests.
        exportMode: 'immediate',
        // LANGFUSE_TRACING_ENVIRONMENT env var overrides this; falls back to
        // NODE_ENV so local/dev traces never get tagged "production" by default.
        environment: process.env.LANGFUSE_TRACING_ENVIRONMENT || process.env.NODE_ENV || 'development',
        // Visitors can type anything into the portfolio chat, and that text
        // flows straight into generation input/output — redact obvious PII
        // (emails, phone numbers) before it leaves for Langfuse.
        mask: ({ data }) => {
            const str = typeof data === 'string' ? data : JSON.stringify(data)
            const masked = str
                .replace(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
                .replace(/\+?\d[\d .()-]{7,}\d/g, '[REDACTED_PHONE]')

            if (typeof data === 'string') return masked
            try {
                return JSON.parse(masked)
            } catch {
                return masked
            }
        },
    })

    const sdk = new NodeSDK({
        spanProcessors: [langfuseSpanProcessor],
    })

    sdk.start()
}
