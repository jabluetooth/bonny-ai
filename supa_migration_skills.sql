-- Reset (Caution: This deletes existing skills data!)
DROP TABLE IF EXISTS public.skills;
DROP TABLE IF EXISTS public.skill_categories CASCADE;

-- Create Categories Table
CREATE TABLE public.skill_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    icon_name TEXT, -- e.g. 'Globe', 'Cpu', 'Palette', 'Users'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Skills Table
CREATE TABLE public.skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.skill_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT, -- Specific response text for the AI to use
    icon_url TEXT, -- For the marquee/cards
    is_highlight BOOLEAN DEFAULT FALSE, -- If true, shows in the top Marquee
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Read only for public)
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on categories" ON public.skill_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on skills" ON public.skills FOR SELECT USING (true);

-- SEED DATA --

-- 1. Insert Categories
INSERT INTO public.skill_categories (title, icon_name, sort_order) VALUES
('Frontend Development', 'Globe', 1),
('Backend Development', 'Cpu', 2),
('Design & Tools', 'Palette', 3),
('Soft Skills', 'Users', 4);

-- 2. Insert Skills (Frontend)
DO $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM public.skill_categories WHERE title = 'Frontend Development';

    INSERT INTO public.skills (category_id, name, description, is_highlight, sort_order) VALUES
    (cat_id, 'HTML', 'I have mastery of semantic HTML5, ensuring accessibility and SEO best practices.', false, 1),
    (cat_id, 'CSS', 'Proficient in modern CSS, including Flexbox, Grid, and animations.', false, 2),
    (cat_id, 'TypeScript', 'My primary language. I use TypeScript for type-safe, scalable codebases.', true, 3),
    (cat_id, 'Tailwind CSS', 'I use Tailwind for rapid, responsive UI development with a focus on design systems.', true, 4),
    (cat_id, 'React', 'Expert in React ecosystem, hooks, and state management.', true, 5),
    (cat_id, 'Next.js', 'I build server-rendered, performant web apps using Next.js App Router.', true, 6),
    (cat_id, 'Framer Motion', 'I use Framer Motion to add fluid, complex animations to React apps.', false, 7);
END $$;

-- 3. Insert Skills (Backend)
DO $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM public.skill_categories WHERE title = 'Backend Development';

    INSERT INTO public.skills (category_id, name, description, is_highlight, sort_order) VALUES
    (cat_id, 'Node.js', 'Experienced in building scalable RESTful APIs and microservices with Node.', true, 1),
    (cat_id, 'PostgreSQL', 'Proficient in relational database design, complex queries, and optimization.', false, 2),
    (cat_id, 'Supabase', 'I use Supabase for instant backend-as-a-service, Auth, and Realtime features.', true, 3),
    (cat_id, 'Python', 'Comfortable with Python for scripting, automation, and backend logic.', true, 4);
END $$;

-- 4. Insert Skills (Design & Tools)
DO $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM public.skill_categories WHERE title = 'Design & Tools';

    INSERT INTO public.skills (category_id, name, description, is_highlight, sort_order) VALUES
    (cat_id, 'Figma', 'I use Figma for prototyping, wireframing, and design system management.', true, 1),
    (cat_id, 'Git', 'Proficient in Git flow, branching strategies, and collaboration.', false, 2),
    (cat_id, 'VS Code', 'My editor of choice, optimized with extensions for productivity.', false, 3);
END $$;

-- 5. Insert Skills (Soft Skills)
DO $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM public.skill_categories WHERE title = 'Soft Skills';

    INSERT INTO public.skills (category_id, name, description, is_highlight, sort_order) VALUES
    (cat_id, 'Communication', 'I believe in clear, proactive communication to align technical and business goals.', false, 1),
    (cat_id, 'Teamwork', 'I thrive in collaborative environments and enjoy pair programming.', false, 2),
    (cat_id, 'Problem Solving', 'I approach bugs analytically and enjoy solving complex algorithmic challenges.', false, 3);
END $$;

-- Update Marquee Images (Specific Updates)
UPDATE public.skills SET icon_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png' WHERE name = 'React';
UPDATE public.skills SET icon_url = 'https://assets.vercel.com/image/upload/v1607554385/repositories/next-js/next-js.png' WHERE name = 'Next.js';
UPDATE public.skills SET icon_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/1200px-Typescript_logo_2020.svg.png' WHERE name = 'TypeScript';
UPDATE public.skills SET icon_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1200px-Node.js_logo.svg.png' WHERE name = 'Node.js';
UPDATE public.skills SET icon_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Supabase_logo.svg/1200px-Supabase_logo.svg.png' WHERE name = 'Supabase';
UPDATE public.skills SET icon_url = 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg' WHERE name = 'Tailwind CSS';
UPDATE public.skills SET icon_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1200px-Python-logo-notext.svg.png' WHERE name = 'Python';
UPDATE public.skills SET icon_url = 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg' WHERE name = 'Figma';
