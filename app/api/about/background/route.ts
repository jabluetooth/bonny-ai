import { createPublicClient as createClient } from '@/lib/supabase-public';
import { NextResponse } from 'next/server';


// Public content, cached for five minutes (see lib/supabase-public.ts).
export const revalidate = 300;

export async function GET() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('background_cards')
            .select('*')
            .order('display_order', { ascending: true });


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
