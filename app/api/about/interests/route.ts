import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    console.log("API: Fetching interests...");

    try {
        const { data, error } = await supabase
            .from('interests')
            .select('*')
            .order('display_order', { ascending: true });

        // Check if data exists
        if (!error && data && data.length > 0) {
            return NextResponse.json({ data });
        }

        console.warn("Supabase 'interests' table empty or error. Using fallback data.", error);

        // Fallback Mock Data
        const fallbackData = [
            {
                title: "Photography",
                description: "I love capturing moments that tell a story. Whether it's street photography in a bustling city or landscapes in the quiet outdoors, framing the world through a lens gives me a new perspective.",
                image_url: "https://images.unsplash.com/photo-1542038784424-fa00ed49fc03?q=80&w=2670&auto=format&fit=crop"
            },
            {
                title: "Gaming",
                description: "From strategic RPGs to fast-paced FPS, gaming is my way to unwind and challenge myself. I enjoy exploring immersive worlds and the storytelling that modern games offer.",
                image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop"
            },
            {
                title: "Traveling",
                description: "Experiencing new cultures and cuisines is what drives me. I believe that travel is the best form of education, and I try to visit a new country every year.",
                image_url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2670&auto=format&fit=crop"
            },
            {
                title: "Reading",
                description: "I'm an avid reader of sci-fi and philosophy. Books like 'Dune' and 'Sapiens' have shaped my worldview. There's nothing quite like getting lost in a good book.",
                image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2698&auto=format&fit=crop"
            }
        ];

        return NextResponse.json({ data: fallbackData });

    } catch (err) {
        console.error("Internal Server Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
