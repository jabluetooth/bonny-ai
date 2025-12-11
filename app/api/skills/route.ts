import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';

export async function GET() {
    const supabase = createClient();

    // Fetch categories with their skills
    // We join the tables manually or via easy relation query if setup, but standard join is safer if relation names vary.
    // Actually, supbase js client handles nested resource embedding if foreign keys exist.
    // We set up REFERENCES in SQL, so it should work.

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
            ? cat.skills.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            : []
    })) || [];

    return NextResponse.json({ categories: sortedCategories });
}
