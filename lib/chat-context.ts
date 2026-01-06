import { SupabaseClient } from '@supabase/supabase-js';
import { ChatIntents } from './intents';
import { LLMContext, ProjectContext, SkillContext, ExperienceContext, ProfileContext } from './llm';

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
        about: []
    };

    // --- Intent-Specific Fetching ---

    // 1. ABOUT / VISION / INTERESTS
    if (intent === ChatIntents.ABOUT_ME || intent === ChatIntents.VISION || intent === ChatIntents.INTERESTS || intent === ChatIntents.BACKGROUND) {
        // Try active profile first
        let { data } = await supabase.from('author_profiles').select('*').eq('is_active', true).maybeSingle();

        // Fallback: If no active profile found, take the first one available
        if (!data) {
            const { data: fallbackData } = await supabase.from('author_profiles').select('*').limit(1).maybeSingle();
            data = fallbackData;
        }

        context.about = mapProfile(data ? [data] : []);

        // If background, also fetch experience
        if (intent === ChatIntents.BACKGROUND) {
            const { data: exp } = await supabase.from('experiences').select('*').order('id', { ascending: false });
            context.experience = mapExperience(exp || []);
        }
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
        const [projects, skills, experience, about, contacts] = await Promise.all([
            supabase.from('projects').select('*, project_skills(skills(name))').limit(5),
            supabase.from('skills').select('*, category:skill_categories(title)'),
            supabase.from('experiences').select('*').limit(3),
            supabase.from('author_profiles').select('*').eq('is_active', true),
            supabase.from('contact_links').select('*').eq('is_active', true)
        ]);

        const rawProjects = projects.data?.map((p: any) => ({
            ...p,
            tech_stack: p.project_skills?.map((ps: any) => ps.skills?.name) || []
        })) || [];

        context.projects = mapProjects(rawProjects);
        context.skills = mapSkills(skills.data || []);
        context.experience = mapExperience(experience.data || []);
        context.about = mapProfile(about.data || []);

        // Add contacts to context
        const links = contacts.data || [];
        if (links.length > 0) {
            // @ts-ignore
            context.contactLinks = links.map(l => ({ platform: l.platform, url: l.url }));
        }
    }

    return context;
}
