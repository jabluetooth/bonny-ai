import { createPublicClient as createClient } from '@/lib/supabase-public';
import { NextResponse } from 'next/server';


// Public content, cached for five minutes (see lib/supabase-public.ts).
export const revalidate = 300;

export async function GET() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('vision_cards')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[about/vision]', error.message);
            return NextResponse.json({ data: [] });
        }

        return NextResponse.json({ data });
    } catch (err) {
        console.error("Internal Server Error:", err);
        return NextResponse.json({ data: [] });
    }
}

