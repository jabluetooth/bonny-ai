-- Business-focused restructure: services, case-study fields on projects,
-- and an editable hero headline on the author profile.
--
-- Run once in the Supabase SQL editor. Every statement is idempotent
-- (IF NOT EXISTS / DROP POLICY IF EXISTS), so re-running it is safe.
--
-- The old interests / vision_cards / background_cards tables are NOT
-- dropped here. The app no longer reads them; drop them yourself once you
-- are sure you don't want the data:
--   drop table if exists interests, vision_cards, background_cards;

-- ---------------------------------------------------------------------------
-- 1. Services: "problems I solve" — one row per offer.
-- ---------------------------------------------------------------------------
create table if not exists services (
    id uuid primary key default gen_random_uuid(),
    title text not null,                 -- e.g. "Workflow automation"
    problem text not null default '',    -- the pain, in the client's words
    solution text not null default '',   -- what you build / do about it
    outcome text not null default '',    -- the business result they get
    image_url text,
    display_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists services_display_order_idx on services (display_order);

alter table services enable row level security;

-- Anyone (including anonymous chat visitors) can read active services.
drop policy if exists "services_public_read" on services;
create policy "services_public_read" on services
    for select
    using (is_active = true);

-- Only the admin account can read inactive rows and write. Anonymous chat
-- visitors are also in the `authenticated` role, so a bare
-- `to authenticated` policy would let any visitor edit services — the
-- email check is what actually restricts this. Keep it in sync with the
-- MY_EMAIL env var.
drop policy if exists "services_admin_all" on services;
create policy "services_admin_all" on services
    for all
    to authenticated
    using ((auth.jwt() ->> 'email') = 'filheinz27@gmail.com')
    with check ((auth.jwt() ->> 'email') = 'filheinz27@gmail.com');

-- ---------------------------------------------------------------------------
-- 2. Case-study fields on projects.
-- ---------------------------------------------------------------------------
alter table projects add column if not exists industry text;
alter table projects add column if not exists problem text;
alter table projects add column if not exists solution text;
-- Short headline results shown as stat chips, e.g. {"20 hrs/week saved","3x faster onboarding"}
alter table projects add column if not exists results text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- 3. Editable hero copy on the author profile.
-- ---------------------------------------------------------------------------
alter table author_profiles add column if not exists headline text;
alter table author_profiles add column if not exists subheadline text;
