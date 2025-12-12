import { SupabaseClient } from '@supabase/supabase-js';
import { ChatIntents } from './intents';

// Helper to reduce token usage
const minifyData = (items: any[], fields: string[]) => {
    return items?.map(item => {
        const mini: any = {};
        fields.forEach(f => {
            if (item[f]) mini[f] = item[f];
        });
        if (item.category?.title) mini.category = item.category.title;
        return mini;
    }) || [];
};

export async function getContextForIntent(
    supabase: SupabaseClient,
    intent: string | undefined,
    userName: string
) {
    let context: any = {
        userName: userName,
    };

    if (intent === ChatIntents.ABOUT_ME) {
        const { data: about } = await supabase.from('about').select('*');
        context.about = minifyData(about || [], ['title', 'bio', 'content', 'description']);
    }
    else if (intent === ChatIntents.WORK || intent === ChatIntents.EDUCATION) {
        const { data: experience } = await supabase.from('experience').select('*');
        context.experience = minifyData(experience || [], ['company', 'role', 'position', 'period', 'duration', 'date', 'description']);
    }
    else if (intent === ChatIntents.PROJECTS) {
        const { data: projects } = await supabase.from('projects').select('*');
        context.projects = minifyData(projects || [], ['title', 'name', 'description', 'technologies', 'tech_stack', 'link', 'url']);
    }
    else if (intent === ChatIntents.SKILLS) {
        const { data: skills } = await supabase.from('skills').select('*, category:skill_categories(title)');
        context.skills = minifyData(skills || [], ['name', 'description']);
        context.categories = Array.from(new Set(skills?.map((s: any) => s.category?.title).filter(Boolean))) || [];
    }
    else if (intent === ChatIntents.INTERESTS || intent === ChatIntents.VISION) {
        const { data: about } = await supabase.from('about').select('*');
        context.about = minifyData(about || [], ['title', 'content', 'description']);
    }
    else {
        // FALLBACK: Fetch everything minified (General Chat)
        const [
            { data: projects },
            { data: skills },
            { data: experience },
            { data: about }
        ] = await Promise.all([
            supabase.from('projects').select('*'),
            supabase.from('skills').select('*, category:skill_categories(title)'),
            supabase.from('experience').select('*'),
            supabase.from('about').select('*'),
        ]);

        context.projects = minifyData(projects || [], ['title', 'description', 'technologies']);
        context.skills = minifyData(skills || [], ['name']);
        context.experience = minifyData(experience || [], ['company', 'role']);
        context.about = minifyData(about || [], ['title', 'content']);
    }

    return context;
}
