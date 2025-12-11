-- ==========================================
-- 1. USER & CHAT DATA (Private, Owner Access Only)
-- ==========================================

-- USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- CONVERSATIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own conversations" ON public.conversations;
CREATE POLICY "Users can read own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
CREATE POLICY "Users can insert own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON public.messages;
CREATE POLICY "Users can read messages in their conversations" 
ON public.messages FOR SELECT 
USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations" 
ON public.messages FOR INSERT 
WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

-- ==========================================
-- 2. PORTFOLIO DATA (Public Read Access)
-- ==========================================

-- SKILLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read skills" ON public.skills;
CREATE POLICY "Public can read skills" ON public.skills FOR SELECT USING (true);

-- SKILL CATEGORIES
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read skill categories" ON public.skill_categories;
CREATE POLICY "Public can read skill categories" ON public.skill_categories FOR SELECT USING (true);

-- PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read projects" ON public.projects;
CREATE POLICY "Public can read projects" ON public.projects FOR SELECT USING (true);

-- EXPERIENCE
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read experience" ON public.experience;
CREATE POLICY "Public can read experience" ON public.experience FOR SELECT USING (true);

-- ABOUT
ALTER TABLE public.about ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read about" ON public.about;
CREATE POLICY "Public can read about" ON public.about FOR SELECT USING (true);

-- SITE STATS (Public Read, No Insert/Update by users)
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read site_stats" ON public.site_stats;
CREATE POLICY "Public can read site_stats" ON public.site_stats FOR SELECT USING (true);

