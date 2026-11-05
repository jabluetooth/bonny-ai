import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('services')
        .select('id, title, problem, solution, outcome, image_url')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('[API] Error fetching services:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
}
