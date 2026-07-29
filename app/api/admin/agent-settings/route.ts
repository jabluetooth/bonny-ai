import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
    const user = await requireAdminUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('agent_settings')
        .select('enabled, updated_at')
        .eq('id', 1)
        .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ enabled: data?.enabled ?? true, updated_at: data?.updated_at ?? null })
}

export async function PATCH(request: Request) {
    const user = await requireAdminUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body || typeof body.enabled !== 'boolean') {
        return NextResponse.json({ error: 'enabled (boolean) is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
        .from('agent_settings')
        .upsert({ id: 1, enabled: body.enabled, updated_at: new Date().toISOString() })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ enabled: body.enabled })
}
