import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();

    try {
        const { data: experiences, error } = await supabase
            .from('experiences')
            .select(`
                *,
                experience_skills (
                    skills (
                        name
                    )
                )
            `)
            .order('id', { ascending: true }); // Or order by date if you prefer

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform relation to string array for frontend compatibility
        const mappedExperiences = experiences?.map(e => ({
            ...e,
            tech_stack: e.experience_skills?.map((es: any) => es.skills?.name) || []
        })) || [];

        return NextResponse.json(mappedExperiences);
    } catch (err) {
        console.error('API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
