import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    console.log("API: Fetching background cards...");

    try {
        const { data, error } = await supabase
            .from('background_cards')
            .select('*')
            .order('display_order', { ascending: true });

        console.log(`API: Found ${data?.length || 0} cards`);

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (err) {
        console.error("Internal Server Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
