import { createPublicClient as createClient } from '@/lib/supabase-public';
import { NextResponse } from 'next/server';


// Public content, cached for five minutes (see lib/supabase-public.ts).
export const revalidate = 300;

export async function GET() {
    const supabase = await createClient();

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

        return NextResponse.json({ data });
    } catch (err) {
        console.error("Internal Server Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
