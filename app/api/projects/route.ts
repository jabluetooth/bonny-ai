import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const categoryQuery = searchParams.get('category')?.toLowerCase();

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('[API] Check connection:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'URL Found' : 'URL Missing');

    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            *,
            project_skills (
                skills (
                    name
                )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[API] Error fetching projects:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Projects Found:', projects?.length);

    // FALLBACK: If DB is empty, use Mock Data so the UI isn't broken.
    let sourceData: any[] = projects || [];

    // Transform relation to string array for frontend compatibility
    sourceData = sourceData.map(p => ({
        ...p,
        tech_stack: p.project_skills?.map((ps: any) => ps.skills?.name) || []
    }));

    if (!sourceData || sourceData.length === 0) {
        console.log('[API] DB Empty. Using Mock Data fallback.');
        sourceData = [
            {
                title: 'E-Commerce Dashboard',
                description: 'A comprehensive dashboard for managing online stores, sales, and inventory.',
                tech_stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Recharts'],
                github_url: 'https://github.com/',
                live_url: 'https://demo.com',
                demo_url: 'https://demo.com',
                image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
                key_features: ['Real-time sales analytics', 'Inventory management', 'User role management', 'Order tracking system'],
                challenges_learned: 'Implementing real-time updates for the inventory system was challenging.',
                type: 'Web Development'
            },
            {
                title: 'SaaS Landing Page',
                description: 'A high-conversion landing page for a SaaS product with pricing and auth.',
                tech_stack: ['React', 'Vite', 'Stripe', 'Framer Motion'],
                github_url: 'https://github.com/',
                live_url: 'https://demo.com',
                demo_url: 'https://demo.com',
                image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000',
                key_features: ['Responsive Design', 'Stripe Checkout', 'Animated sequences', 'SEO Optimized'],
                challenges_learned: 'Optimizing images and animations for a perfect Lighthouse score.',
                type: 'Web Development'
            },
            {
                title: 'Task Management App',
                description: 'A collaborative task management tool for teams.',
                tech_stack: ['Vue.js', 'Firebase', 'Pinia', 'Drag and Drop API'],
                github_url: 'https://github.com/',
                live_url: 'https://demo.com',
                demo_url: 'https://demo.com',
                image_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=1000',
                key_features: ['Drag and drop interface', 'Collaborative workspaces', 'Due date notifications', 'Dark mode support'],
                challenges_learned: 'Designing a smooth drag-and-drop experience across different devices.',
                type: 'Web Development'
            },
            {
                title: 'AI Chat Assistant',
                description: 'An intelligent chat interface powered by large language models.',
                tech_stack: ['React', 'OpenAI API', 'Vercel AI SDK', 'Radix UI'],
                github_url: 'https://github.com/',
                live_url: 'https://demo.com',
                demo_url: 'https://demo.com',
                image_url: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=1000&auto=format&fit=crop',
                key_features: ['Context-aware conversations', 'Streaming responses', 'Markdown support', 'Code syntax highlighting'],
                challenges_learned: 'Handling streaming responses and maintaining conversation history locally.',
                type: 'AI & ML'
            },
            {
                title: 'Image Recognition Model',
                description: 'A computer vision model capable of identifying objects in real-time video feeds.',
                tech_stack: ['Python', 'TensorFlow', 'OpenCV', 'FastAPI'],
                github_url: 'https://github.com/',
                live_url: 'https://demo.com',
                demo_url: 'https://demo.com',
                image_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1000&auto=format&fit=crop',
                key_features: ['Real-time object detection', 'High accuracy', 'Low latency inference', 'Video stream processing'],
                challenges_learned: 'Optimizing the model for real-time performance on edge devices.',
                type: 'AI & ML'
            },
            {
                title: 'Sentiment Analysis Tool',
                description: 'An NLP tool that analyzes customer feedback to determine sentiment trends.',
                tech_stack: ['Python', 'NLP', 'Hugging Face', 'Streamlit'],
                github_url: 'https://github.com/',
                live_url: 'https://demo.com',
                demo_url: 'https://demo.com',
                image_url: 'https://images.unsplash.com/photo-1518186285589-1f76d31d6928?q=80&w=1000&auto=format&fit=crop',
                key_features: ['Multi-language support', 'Trend visualization', 'Exportable reports', 'Custom model fine-tuning'],
                challenges_learned: 'Fine-tuning a BERT model on a specific industry dataset.',
                type: 'AI & ML'
            }
        ];
    }

    if (sourceData && sourceData.length > 0) {
        // Map DB fields to Frontend Interface
        let mappedProjects = sourceData.map((p: any) => ({
            title: p.title,
            image_url: p.image_url,
            description: p.description,
            github_url: p.github_url,
            project_url: p.live_url || p.demo_url || p.project_url,
            features: p.key_features || p.features || [],
            tech_stack: p.tech_stack || [],
            challenges: p.challenges_learned || p.challenges || "",
            type: p.type // Map 'type' column
        }));

        // Filter by Category/Type
        if (categoryQuery) {
            mappedProjects = mappedProjects.filter((p: any) => {
                // Check if 'type' column matches the query (flexible check for "Both")
                if (p.type) {
                    return p.type.toLowerCase().includes(categoryQuery);
                }

                // Fallback to keyword matching if type is missing
                const text = (p.title + ' ' + p.description + ' ' + (p.tech_stack || []).join(' ')).toLowerCase();
                if (categoryQuery === 'web') {
                    return text.includes('react') || text.includes('next') || text.includes('vue') || text.includes('web') || text.includes('css') || text.includes('html');
                }
                if (categoryQuery === 'ai' || categoryQuery === 'ml') {
                    return text.includes('ai') || text.includes('gpt') || text.includes('model') || text.includes('python') || text.includes('tensor') || text.includes('robot') || text.includes('neural') || text.includes('intelligence');
                }
                return true;
            });
        }

        // Return filtered result
        if (mappedProjects.length === 0) return NextResponse.json([]);

        // Ensure enough items for looping (e.g. at least 6)
        return NextResponse.json(mappedProjects);
    }

    return NextResponse.json([]);
}
