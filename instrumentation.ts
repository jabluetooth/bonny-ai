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

    langfuseSpanProcessor = new LangfuseSpanProcessor()

    const sdk = new NodeSDK({
        spanProcessors: [langfuseSpanProcessor],
    })

    sdk.start()
}
