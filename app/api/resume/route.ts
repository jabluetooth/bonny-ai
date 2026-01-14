import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET: Fetch current resume URL (public access)
export async function GET() {
    const supabase = await createClient();

    // Fetch resume URL from author_profiles (assumes single profile)
    const { data, error } = await supabase
        .from('author_profiles')
        .select('resume_url')
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('[API] Error fetching resume:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        resume_url: data?.resume_url || null
    });
}

// POST: Update resume URL (admin only)
export async function POST(request: Request) {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin email
    if (process.env.MY_EMAIL && user.email !== process.env.MY_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { resume_url } = await request.json();

        if (typeof resume_url !== 'string') {
            return NextResponse.json({ error: 'Invalid resume_url' }, { status: 400 });
        }

        // Update the author_profiles table
        // First check if a profile exists
        const { data: existing } = await supabase
            .from('author_profiles')
            .select('id')
            .single();

        if (existing) {
            // Update existing profile
            const { error: updateError } = await supabase
                .from('author_profiles')
                .update({ resume_url })
                .eq('id', existing.id);

            if (updateError) {
                console.error('[API] Error updating resume:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
        } else {
            // Create new profile with resume_url
            const { error: insertError } = await supabase
                .from('author_profiles')
                .insert({ resume_url });

            if (insertError) {
                console.error('[API] Error inserting resume:', insertError);
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, resume_url });

    } catch (error: any) {
        console.error('[API] Resume update error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update resume' }, { status: 500 });
    }
}

// DELETE: Remove resume URL (admin only)
export async function DELETE() {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin email
    if (process.env.MY_EMAIL && user.email !== process.env.MY_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
        .from('author_profiles')
        .update({ resume_url: null })
        .not('id', 'is', null); // Update all (should be just one)

    if (error) {
        console.error('[API] Error deleting resume:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
