import { createPublicClient } from "@/lib/supabase-public";

export interface AuthorProfile {
    title: string;
    description: string;
    images: string[];
    status?: string;
}

export interface BackgroundCard {
    id: string;
    title: string;
    description: string;
    image: string;
    date_range: string;
}

export interface VisionCard {
    quote: string;
    name: string;
    title: string;
}

export interface Interest {
    title: string;
    description: string;
    image_url?: string;
}

export interface SkillItem {
    name: string;
}

export interface SkillCategory {
    title: string;
    skills: SkillItem[];
}

export interface PortfolioProject {
    title: string;
    description?: string;
    image_url?: string;
    github_url?: string;
    project_url?: string;
    features: string[];
    tech_stack: string[];
    challenges: string;
    type?: string;
    status?: string;
}

export interface PortfolioExperience {
    id: number;
    category?: string;
    company: string;
    role: string;
    date: string;
    location: string;
    type: string;
    description: string[];
    tech_stack: string[];
}



export async function getAuthorProfile(): Promise<AuthorProfile | null> {
    const supabase = createPublicClient();
    const { data } = await supabase
        .from("author_profiles")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
    return data ?? null;
}

export async function getBackgroundCards(): Promise<BackgroundCard[]> {
    const supabase = createPublicClient();
    const { data } = await supabase
        .from("background_cards")
        .select("*")
        .order("display_order", { ascending: true });
    return data ?? [];
}

export async function getVisionCards(): Promise<VisionCard[]> {
    const supabase = createPublicClient();
    const { data } = await supabase
        .from("vision_cards")
        .select("*")
        .order("created_at", { ascending: true });
    return data ?? [];
}

export async function getInterests(): Promise<Interest[]> {
    const supabase = createPublicClient();
    const { data } = await supabase
        .from("interests")
        .select("*")
        .order("display_order", { ascending: true });
    return data ?? [];
}

export async function getSkillCategories(): Promise<SkillCategory[]> {
    const supabase = createPublicClient();
    const { data: categories } = await supabase
        .from("skill_categories")
        .select(`*, skills (*)`)
        .order("sort_order", { ascending: true });

    return (categories ?? []).map((cat) => ({
        ...cat,
        skills: Array.isArray(cat.skills)
            ? [...cat.skills].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            : [],
    }));
}

export async function getProjects(category?: string): Promise<PortfolioProject[]> {
    const supabase = createPublicClient();
    const { data: projects } = await supabase
        .from("projects")
        .select(`*, project_skills (skills (name))`)
        .order("created_at", { ascending: false });

    let mapped: PortfolioProject[] = (projects ?? []).map((p) => ({
        title: p.title,
        image_url: p.image_url,
        description: p.description,
        github_url: p.github_url,
        project_url: p.live_url || p.demo_url || p.project_url,
        features: p.key_features || p.features || [],
        tech_stack: p.project_skills?.map((ps: { skills?: { name?: string } }) => ps.skills?.name).filter(Boolean) || [],
        challenges: p.challenges_learned || p.challenges || "",
        type: p.type,
        status: p.status || "Work in progress",
    }));

    if (category) {
        const q = category.toLowerCase();
        mapped = mapped.filter((p) => {
            if (p.type) return p.type.toLowerCase().includes(q);
            return true;
        });
    }

    return mapped;
}

export async function getExperiences(category?: string): Promise<PortfolioExperience[]> {
    const supabase = createPublicClient();
    const { data } = await supabase
        .from("experiences")
        .select("*")
        .order("id", { ascending: false });

    const experiences: PortfolioExperience[] = data ?? [];

    if (!category) return experiences;

    return experiences.filter(
        (exp) => exp.category === category || (!exp.category && category === "work")
    );
}
