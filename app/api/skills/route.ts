import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();

    // Fetch categories with their skills
    const { data: categories, error } = await supabase
        .from('skill_categories')
        .select(`
            id,
            title,
            icon_name,
            sort_order,
            skills (
                id,
                name,
                description,
                icon_url,
                is_highlight,
                sort_order
            )
        `)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error("Error fetching skills:", error);
        return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    // Sort inner skills (Supabase doesn't always sort nested arrays easily in one go without complex modifiers)
    // We sort properly in code to be safe.
    const sortedCategories = categories?.map(cat => ({
        ...cat,
        skills: Array.isArray(cat.skills)
            ? cat.skills.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            : []
    })) || [];

    return NextResponse.json({ categories: sortedCategories });
}
