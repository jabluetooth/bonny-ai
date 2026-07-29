import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface ProjectSkillRow {
    skills?: { name?: string } | null;
}

interface ProjectSourceRow {
    title?: string;
    description?: string;
    tech_stack?: string[];
    github_url?: string;
    live_url?: string;
    demo_url?: string;
    project_url?: string;
    image_url?: string;
    key_features?: string[];
    features?: string[];
    challenges_learned?: string;
    challenges?: string;
    type?: string;
    status?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const categoryQuery = searchParams.get('category')?.toLowerCase();

    const supabase = await createClient();

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

    let sourceData: ProjectSourceRow[] = (projects || []).map(p => ({
        ...p,
        tech_stack: p.project_skills?.map((ps: ProjectSkillRow) => ps.skills?.name) || []
    }));

    // Development-only fallback so the UI isn't broken with an empty DB locally
    if (sourceData.length === 0 && process.env.NODE_ENV !== 'production') {
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
                type: 'Web Development',
                status: 'Online'
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
                type: 'Web Development',
                status: 'Online'
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
                type: 'Web Development',
                status: 'Work in progress'
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
                type: 'AI & ML',
                status: 'Online'
            },
        ];
    }

    if (sourceData.length === 0) return NextResponse.json([]);

    let mappedProjects = sourceData.map((p) => ({
        title: p.title,
        image_url: p.image_url,
        description: p.description,
        github_url: p.github_url,
        project_url: p.live_url || p.demo_url || p.project_url,
        features: p.key_features || p.features || [],
        tech_stack: p.tech_stack || [],
        challenges: p.challenges_learned || p.challenges || "",
        type: p.type,
        status: p.status || 'Work in progress'
    }));

    if (categoryQuery) {
        mappedProjects = mappedProjects.filter((p) => {
            if (p.type) {
                return p.type.toLowerCase().includes(categoryQuery);
            }
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

    if (mappedProjects.length === 0) return NextResponse.json([]);

    return NextResponse.json(mappedProjects);
}
