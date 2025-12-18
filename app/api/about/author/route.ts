import { createClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('author_profiles')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error) {
            console.error("Supabase error:", error);
            // It's possible no row exists, handle gracefully
            if (error.code === 'PGRST116') {
                return NextResponse.json({ data: null });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
            },
        });
    } catch (err) {
        console.error("Internal Server Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
