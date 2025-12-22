import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();

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
