import { NextResponse } from 'next/server';
import { createPublicClient as createClient } from '@/lib/supabase-public';


// Public content, cached for five minutes (see lib/supabase-public.ts).
export const revalidate = 300;

export async function GET() {
    const supabase = await createClient();

    // Fetch categories with their skills (Relational)
    const { data: categories, error } = await supabase
        .from('skill_categories')
        .select(`
            *,
            skills (*)
        `)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error("Error fetching skills:", error);
        return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    // Prepare response for frontend
    const sortedCategories = categories?.map(cat => ({
        ...cat,
        skills: Array.isArray(cat.skills)
            ? cat.skills.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            : []
    })) || [];

    return NextResponse.json({ categories: sortedCategories });
}
