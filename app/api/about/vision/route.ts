import { createClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('vision_cards')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Supabase error:", error);
            // Fallback to mock data if table doesn't exist yet
            return NextResponse.json({ data: fallbackData });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ data: fallbackData });
        }

        return NextResponse.json({ data });
    } catch (err) {
        console.error("Internal Server Error:", err);
        return NextResponse.json({ data: fallbackData });
    }
}

const fallbackData = [
    {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        name: "Eleanor Roosevelt",
        title: "Inspiration",
        row_position: "top"
    },
    {
        quote: "Artificial intelligence is not a substitute for human intelligence; it is a tool to amplify human creativity and ingenuity.",
        name: "Fei-Fei Li",
        title: "AI & Humanity",
        row_position: "top"
    },
    {
        quote: "Any sufficiently advanced technology is indistinguishable from magic.",
        name: "Arthur C. Clarke",
        title: "Technology",
        row_position: "top"
    },
    {
        quote: "The best way to predict the future is to invent it.",
        name: "Alan Kay",
        title: "Computed Science",
        row_position: "bottom"
    },
    {
        quote: "Creativity is intelligence having fun.",
        name: "Albert Einstein",
        title: "Innovation",
        row_position: "bottom"
    }
];
