import { SupabaseClient } from '@supabase/supabase-js';
import { ChatIntents } from './intents';
import { LLMContext, ProjectContext, SkillContext, ExperienceContext, ProfileContext, InterestContext, VisionContext, BackgroundContext } from './llm';

// Helper to sanitize/map DB data to strict types
const mapProjects = (items: any[]): ProjectContext[] => items.map(p => ({
    title: p.title,
    description: p.description,
    tech_stack: p.tech_stack || [], // Handled by API route logic usually, so ensuring array
    url: p.live_url || p.demo_url,
    github: p.github_url
}));

const mapSkills = (items: any[]): SkillContext[] => items.map(s => ({
    name: s.name,
    category: s.category?.title,
    description: s.description
}));

const mapExperience = (items: any[]): ExperienceContext[] => items.map(e => ({
    company: e.company,
    role: e.role,
    date: e.date,
    description: e.description || [],
    type: e.type
}));

const mapProfile = (items: any[]): ProfileContext[] => items.map(p => ({
    content: p.description
}));

const mapInterests = (items: any[]): InterestContext[] => items.map(i => ({
    title: i.title?.replace(/:$/, '') || '', // Remove trailing colon
    description: i.description || ''
}));

const mapVision = (items: any[]): VisionContext[] => items.map(v => ({
    quote: v.quote,
    author: v.name,
    category: v.title
}));

const mapBackground = (items: any[]): BackgroundContext[] => items.map(b => ({
    title: b.title?.replace(/:$/, '') || '', // Remove trailing colon
    description: b.description || '',
    dateRange: b.date_range,
    category: b.category
}));

export async function getContextForIntent(
    supabase: SupabaseClient,
    intent: string | undefined,
    userName: string
): Promise<LLMContext> {
    const context: LLMContext = {
        userName: userName,
        projects: [],
        skills: [],
        experience: [],
        about: [],
        interests: [],
        vision: [],
        background: []
    };

    // --- Intent-Specific Fetching ---

    // 1. ABOUT ME - Fetch author profile
    if (intent === ChatIntents.ABOUT_ME) {
        let { data } = await supabase.from('author_profiles').select('*').eq('is_active', true).maybeSingle();
        if (!data) {
            const { data: fallbackData } = await supabase.from('author_profiles').select('*').limit(1).maybeSingle();
            data = fallbackData;
        }
        context.about = mapProfile(data ? [data] : []);
    }

    // 2. INTERESTS - Fetch from interests table
    else if (intent === ChatIntents.INTERESTS) {
        const { data: interests } = await supabase.from('interests').select('*').order('id', { ascending: true });
        context.interests = mapInterests(interests || []);
    }

    // 3. VISION - Fetch from vision_cards table
    else if (intent === ChatIntents.VISION) {
        const { data: vision } = await supabase.from('vision_cards').select('*').order('id', { ascending: true });
        context.vision = mapVision(vision || []);
    }

    // 4. BACKGROUND - Fetch from background_cards table + experiences
    else if (intent === ChatIntents.BACKGROUND) {
        const [backgroundCards, experiences] = await Promise.all([
            supabase.from('background_cards').select('*').order('id', { ascending: true }),
            supabase.from('experiences').select('*').order('id', { ascending: false })
        ]);
        context.background = mapBackground(backgroundCards.data || []);
        context.experience = mapExperience(experiences.data || []);
    }

    // 2. EXPERIENCE
    else if (intent === ChatIntents.WORK_HISTORY || intent === ChatIntents.EDUCATION) {
        const typeFilter = intent === ChatIntents.WORK_HISTORY ? 'work' : 'education'; // Assuming DB has 'work'/'education' types or similar
        // For simplicity, fetching all and letting LLM filter or just showing all sorted
        const { data } = await supabase.from('experiences').select('*').order('id', { ascending: false });
        context.experience = mapExperience(data || []);
    }

    // 3. PROJECTS
    else if (intent === ChatIntents.PROJECTS_WEB || intent === ChatIntents.PROJECTS_AI || intent === ChatIntents.PROJECTS_ALL) {
        const query = supabase.from('projects').select('*, project_skills(skills(name))').order('created_at', { ascending: false });
        // NOTE: In a real app we might filter DB side, but for small portfolio, mapping is fine.

        const { data } = await query;
        const rawProjects = data?.map((p: any) => ({
            ...p,
            tech_stack: p.project_skills?.map((ps: any) => ps.skills?.name) || []
        })) || [];

        // Filter in memory for refined context if needed, or just pass all.
        // Passing all gives LLM more context to say "I also have..."
        context.projects = mapProjects(rawProjects);
    }

    // 4. SKILLS
    else if (intent?.startsWith('QUERY_SKILLS')) {
        const { data } = await supabase.from('skills').select('*, category:skill_categories(title)');
        const skills = data || [];

        // Filter if specific category requested to save tokens? 
        // Or just send all so it knows adjacent skills. Sending all is usually better for small datasets.

        context.skills = mapSkills(skills);
    }

    // 5. GENERAL / FALLBACK (Natural Chat)
    else {
        // "Fetch Everything" (Optimized)
        // We fetch top items to give a "gist" of the portfolio
        const [projects, skills, experience, about, contacts, interests, vision, background] = await Promise.all([
            supabase.from('projects').select('*, project_skills(skills(name))').limit(5),
            supabase.from('skills').select('*, category:skill_categories(title)'),
            supabase.from('experiences').select('*').limit(3),
            supabase.from('author_profiles').select('*').eq('is_active', true),
            supabase.from('contact_links').select('*').eq('is_active', true),
            supabase.from('interests').select('*').limit(5),
            supabase.from('vision_cards').select('*').limit(3),
            supabase.from('background_cards').select('*').limit(3)
        ]);

        const rawProjects = projects.data?.map((p: any) => ({
            ...p,
            tech_stack: p.project_skills?.map((ps: any) => ps.skills?.name) || []
        })) || [];

        context.projects = mapProjects(rawProjects);
        context.skills = mapSkills(skills.data || []);
        context.experience = mapExperience(experience.data || []);
        context.about = mapProfile(about.data || []);
        context.interests = mapInterests(interests.data || []);
        context.vision = mapVision(vision.data || []);
        context.background = mapBackground(background.data || []);

        // Add contacts to context
        const links = contacts.data || [];
        if (links.length > 0) {
            // @ts-ignore
            context.contactLinks = links.map(l => ({ platform: l.platform, url: l.url }));
        }
    }

    return context;
}
