-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_pkey PRIMARY KEY (id)
);
CREATE TABLE public.author_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Author/Developer'::text,
  description text NOT NULL DEFAULT 'Learn more about the creator behind this portfolio.'::text,
  images ARRAY NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT author_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.background_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  date_range text NOT NULL,
  class_name text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT background_cards_pkey PRIMARY KEY (id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  assigned_admin_id text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_assigned_admin_id_fkey FOREIGN KEY (assigned_admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.experiences (
  id integer NOT NULL DEFAULT nextval('experiences_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category text NOT NULL CHECK (category = ANY (ARRAY['work'::text, 'education'::text])),
  company text NOT NULL,
  role text NOT NULL,
  date text NOT NULL,
  location text NOT NULL,
  type text NOT NULL,
  logo_url text,
  description ARRAY DEFAULT '{}'::text[],
  -- tech_stack ARRAY DEFAULT '{}'::text[], -- Migrated to experience_skills table
  CONSTRAINT experiences_pkey PRIMARY KEY (id)
);
CREATE TABLE public.interests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  CONSTRAINT interests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_type USER-DEFINED NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  -- tech_stack ARRAY, -- Migrated to project_skills table
  live_url text,
  github_url text,
  created_at timestamp with time zone DEFAULT now(),
  demo_url text,
  image_url text,
  key_features ARRAY,
  challenges_learned text,
  type text,
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site_stats (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  total_users integer DEFAULT 0,
  CONSTRAINT site_stats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.skill_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon_name text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skill_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  name text NOT NULL,
  description text,
  icon_url text,
  is_highlight boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skills_pkey PRIMARY KEY (id),
  CONSTRAINT skills_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.skill_categories(id)
);

CREATE TABLE public.project_skills (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE public.experience_skills (
  experience_id integer REFERENCES public.experiences(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (experience_id, skill_id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  name text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vision_cards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  quote text NOT NULL,
  name text NOT NULL,
  title text NOT NULL,
  row_position text NOT NULL CHECK (row_position = ANY (ARRAY['top'::text, 'bottom'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vision_cards_pkey PRIMARY KEY (id)
);