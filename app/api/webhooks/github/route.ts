import { NextRequest, NextResponse, after } from 'next/server'
import { verifyGithubSignature } from '@/lib/github-webhook'
import { createAdminClient } from '@/lib/supabase-admin'
import { runContentAgentSession } from '@/lib/agent-session'
import { fetchRepoFile } from '@/lib/github-api'
import { langfuseSpanProcessor } from '@/instrumentation'

export const dynamic = 'force-dynamic'
// Agent turns for a single project upsert should be quick, but container
// spin-up + model latency need headroom. >60s requires Vercel Pro — on
// Hobby, cap this lower and expect less margin.
export const maxDuration = 300

export async function POST(request: NextRequest) {
    const rawBody = await request.text()
    const secret = process.env.GITHUB_WEBHOOK_SECRET

    if (!secret) {
        console.error('[github-webhook] GITHUB_WEBHOOK_SECRET not configured')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const signature = request.headers.get('x-hub-signature-256')
    if (!verifyGithubSignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Admin dashboard on/off switch (Settings → AI Agent) — checked before
    // any other work so a disabled agent costs nothing beyond this lookup.
    const { data: settings, error: settingsError } = await supabase
        .from('agent_settings')
        .select('enabled')
        .eq('id', 1)
        .maybeSingle()

    if (settingsError) {
        console.error('[github-webhook] agent_settings lookup failed (treating as enabled):', settingsError)
    }

    if (settings?.enabled === false) {
        return NextResponse.json({ ok: true, skipped: 'agent disabled' })
    }

    const eventType = request.headers.get('x-github-event')
    if (eventType !== 'push') {
        return NextResponse.json({ ok: true, skipped: 'not a push event' })
    }

    const deliveryId = request.headers.get('x-github-delivery')
    if (!deliveryId) {
        return NextResponse.json({ error: 'Missing delivery ID' }, { status: 400 })
    }

    let payload: any
    try {
        payload = JSON.parse(rawBody)
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const repoFullName: string | undefined = payload.repository?.full_name
    const allowedRepos = (process.env.GITHUB_ALLOWED_REPOS || '')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)

    if (!repoFullName || !allowedRepos.includes(repoFullName)) {
        return NextResponse.json({ ok: true, skipped: 'repo not allow-listed' })
    }

    const defaultBranch: string | undefined = payload.repository?.default_branch
    const pushedBranch = String(payload.ref || '').replace('refs/heads/', '')
    if (defaultBranch && pushedBranch !== defaultBranch) {
        return NextResponse.json({ ok: true, skipped: 'not the default branch' })
    }

    // Idempotency: GitHub retries deliveries; a unique-constraint violation
    // (Postgres 23505) means this delivery was already accepted, so treat it
    // as a no-op. Any OTHER error (missing table, RLS, connection issue) is a
    // real failure — surface it instead of silently swallowing every delivery.
    const { error: idempotencyError } = await supabase
        .from('webhook_events')
        .insert({ delivery_id: deliveryId })

    if (idempotencyError) {
        if (idempotencyError.code === '23505') {
            return NextResponse.json({ ok: true, skipped: 'duplicate delivery' })
        }
        console.error('[github-webhook] webhook_events insert failed:', idempotencyError)
        return NextResponse.json(
            { error: 'Idempotency check failed', detail: idempotencyError.message },
            { status: 500 }
        )
    }

    const repoUrl: string = payload.repository?.html_url || ''
    const repoDescription: string | null = payload.repository?.description ?? null
    const commitMessages: string[] = Array.isArray(payload.commits)
        ? payload.commits.map((c: any) => c.message).filter(Boolean)
        : []

    after(async () => {
        try {
            const [readme, packageJson] = await Promise.all([
                fetchRepoFile(repoFullName, defaultBranch || 'main', 'README.md'),
                fetchRepoFile(repoFullName, defaultBranch || 'main', 'package.json'),
            ])

            await runContentAgentSession({
                repoFullName,
                repoUrl,
                repoDescription,
                defaultBranch: defaultBranch || 'main',
                readme,
                packageJson,
                commitMessages,
                deliveryId,
            })
        } catch (error) {
            console.error('[github-webhook] background agent run failed:', error)
        } finally {
            // The function instance can freeze/exit right after this
            // callback returns, so flush explicitly rather than relying on
            // OTel's background batch export timer.
            await langfuseSpanProcessor?.forceFlush()
        }
    })

    return NextResponse.json({ ok: true })
}
