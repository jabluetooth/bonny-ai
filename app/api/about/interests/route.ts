import { createPublicClient as createClient } from '@/lib/supabase-public';
import { NextResponse } from 'next/server';


// Public content, cached for five minutes (see lib/supabase-public.ts).
export const revalidate = 300;

export async function GET() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('interests')
            .select('*')
            .order('display_order', { ascending: true });

        // Check if data exists
        if (!error && data && data.length > 0) {
            return NextResponse.json({ data });
        }

        // No invented fallback: if the table is empty (or unreachable), the
        // About page and the chat simply show no interests rather than
        // placeholder hobbies that may not be true.
        if (error) console.error('[about/interests]', error.message);
        return NextResponse.json({ data: [] });

    } catch (err) {
        console.error("Internal Server Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
