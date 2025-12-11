import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

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
