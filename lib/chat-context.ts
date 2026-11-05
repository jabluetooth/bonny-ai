import { SupabaseClient } from '@supabase/supabase-js';
import { ChatIntents } from './intents';
import { LLMContext, ProjectContext, SkillContext, ExperienceContext, ProfileContext, ServiceContext } from './llm';

/* eslint-disable @typescript-eslint/no-explicit-any -- raw Supabase rows */

const PROJECT_SELECT = '*, project_skills(skills(name))';

const mapProjects = (items: any[]): ProjectContext[] => items.map(p => ({
    title: p.title,
    description: p.description || '',
    tech_stack: p.project_skills?.map((ps: any) => ps.skills?.name).filter(Boolean) || [],
    industry: p.industry || undefined,
    problem: p.problem || undefined,
    solution: p.solution || undefined,
    results: Array.isArray(p.results) ? p.results : [],
    url: p.live_url || p.demo_url,
    github: p.github_url
}));

const mapServices = (items: any[]): ServiceContext[] => items.map(s => ({
    title: s.title,
    problem: s.problem || '',
    solution: s.solution || '',
    outcome: s.outcome || '',
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
    content: p.description || '',
    headline: p.headline || undefined,
}));

export async function getContextForIntent(
    supabase: SupabaseClient,
    intent: string | undefined,
    userName: string
): Promise<LLMContext> {
    const context: LLMContext = { userName };

    if (intent === ChatIntents.ABOUT_ME) {
        const { data } = await supabase.from('author_profiles').select('*').eq('is_active', true).maybeSingle();
        context.about = mapProfile(data ? [data] : []);
    }

    else if (intent === ChatIntents.SERVICES) {
        const [services, projects] = await Promise.all([
            supabase.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true }),
            supabase.from('projects').select(PROJECT_SELECT).order('created_at', { ascending: false }).limit(5),
        ]);
        context.services = mapServices(services.data || []);
        context.projects = mapProjects(projects.data || []);
    }

    else if (intent === ChatIntents.CONTACT) {
        const { data } = await supabase.from('contact_links').select('*').eq('is_active', true);
        context.contactLinks = (data || []).map((l: any) => ({ platform: l.platform, url: l.url }));
    }

    else if (intent === ChatIntents.WORK_HISTORY || intent === ChatIntents.EDUCATION) {
        const { data } = await supabase.from('experiences').select('*').order('id', { ascending: false });
        context.experience = mapExperience(data || []);
    }

    else if (intent === ChatIntents.PROJECTS_WEB || intent === ChatIntents.PROJECTS_AI || intent === ChatIntents.PROJECTS_ALL) {
        const { data } = await supabase.from('projects').select(PROJECT_SELECT).order('created_at', { ascending: false });
        context.projects = mapProjects(data || []);
    }

    else if (intent?.startsWith('QUERY_SKILLS')) {
        const { data } = await supabase.from('skills').select('*, category:skill_categories(title)');
        context.skills = mapSkills(data || []);
    }

    // General / open-ended question: give the model a compact view of
    // everything, with services and case studies first since most free-form
    // questions are about whether I can solve a specific problem.
    else {
        const [services, projects, skills, experience, about, contacts] = await Promise.all([
            supabase.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true }),
            supabase.from('projects').select(PROJECT_SELECT).order('created_at', { ascending: false }).limit(6),
            supabase.from('skills').select('*, category:skill_categories(title)'),
            supabase.from('experiences').select('*').order('id', { ascending: false }).limit(3),
            supabase.from('author_profiles').select('*').eq('is_active', true),
            supabase.from('contact_links').select('*').eq('is_active', true),
        ]);

        context.services = mapServices(services.data || []);
        context.projects = mapProjects(projects.data || []);
        context.skills = mapSkills(skills.data || []);
        context.experience = mapExperience(experience.data || []);
        context.about = mapProfile(about.data || []);
        context.contactLinks = (contacts.data || []).map((l: any) => ({ platform: l.platform, url: l.url }));
    }

    return context;
}
