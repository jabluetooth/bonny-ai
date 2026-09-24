-- ────────────────────────────────────────────────────────────────────────────
-- Security hardening: admin-only writes on portfolio content + rate limiting
--
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- BEFORE RUNNING: replace YOUR_ADMIN_EMAIL below with the same address as the
-- MY_EMAIL environment variable (the Google account you sign in to /admin
-- with). The script refuses to run while the placeholder is still there.
--
-- Why this exists: every visitor gets an anonymous Supabase session so they
-- can chat, and anonymous users carry the `authenticated` role. The admin
-- dashboard writes content straight from the browser with the anon key, so
-- the only thing stopping a visitor from editing your portfolio from the
-- browser console is RLS. A policy like "authenticated users can update"
-- would let them. The RESTRICTIVE policies below are ANDed with whatever
-- permissive policies already exist, so they close that gap without needing
-- to know (or drop) the existing policy names.
-- ────────────────────────────────────────────────────────────────────────────

do $$
begin
  -- The right-hand side is split so a find-and-replace of the placeholder
  -- doesn't touch it.
  if lower('YOUR_ADMIN_EMAIL') = 'your_admin' || '_email' then
    raise exception 'Edit security-hardening.sql: replace YOUR_ADMIN_EMAIL with your MY_EMAIL address first.';
  end if;
end $$;

-- 1. Who counts as the admin ------------------------------------------------

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
     and lower(auth.jwt() ->> 'email') = lower('YOUR_ADMIN_EMAIL');
$$;

-- 2. Admin-only writes on every content table ------------------------------

do $$
declare
  t text;
  content_tables text[] := array[
    'author_profiles', 'background_cards', 'interests', 'vision_cards',
    'projects', 'project_skills', 'skills', 'skill_categories',
    'experiences', 'experience_skills', 'contact_links'
  ];
begin
  foreach t in array content_tables loop
    if to_regclass('public.' || t) is null then
      raise notice 'skipping %, table not found', t;
      continue;
    end if;

    -- If RLS was off, the anon key could write freely. Turn it on and keep
    -- the table publicly readable, since the portfolio pages read it.
    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists "public read" on public.%I', t);
      execute format('create policy "public read" on public.%I for select using (true)', t);
    end if;

    -- Permissive: lets the admin write (harmless if a similar policy exists).
    execute format('drop policy if exists "admin writes" on public.%I', t);
    execute format(
      'create policy "admin writes" on public.%I for all to authenticated
         using (public.is_portfolio_admin()) with check (public.is_portfolio_admin())', t);

    -- Restrictive: whatever else exists, inserts/updates/deletes need the admin.
    execute format('drop policy if exists "only admin inserts" on public.%I', t);
    execute format('drop policy if exists "only admin updates" on public.%I', t);
    execute format('drop policy if exists "only admin deletes" on public.%I', t);
    execute format(
      'create policy "only admin inserts" on public.%I as restrictive for insert
         with check (public.is_portfolio_admin())', t);
    execute format(
      'create policy "only admin updates" on public.%I as restrictive for update
         using (public.is_portfolio_admin()) with check (public.is_portfolio_admin())', t);
    execute format(
      'create policy "only admin deletes" on public.%I as restrictive for delete
         using (public.is_portfolio_admin())', t);
  end loop;
end $$;

-- 3. Per-IP rate limiting ---------------------------------------------------
-- Used by lib/rate-limit.ts for the chat and contact routes. Until this runs,
-- the app falls back to a weaker in-memory limit per server instance.

create table if not exists public.rate_limit_hits (
  key text not null,
  hit_at timestamptz not null default now()
);
create index if not exists rate_limit_hits_key_time on public.rate_limit_hits (key, hit_at desc);
alter table public.rate_limit_hits enable row level security;
-- No policies: only the service role (which bypasses RLS) touches this table.

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  -- Serialise concurrent hits for the same key so two requests can't both
  -- slip under the limit.
  perform pg_advisory_xact_lock(hashtext(p_key));

  select count(*) into recent
  from rate_limit_hits
  where key = p_key and hit_at > now() - make_interval(secs => p_window_seconds);

  if recent >= p_max then
    return false;
  end if;

  insert into rate_limit_hits (key) values (p_key);

  -- Opportunistic cleanup of anything older than a day.
  delete from rate_limit_hits where hit_at < now() - interval '1 day' and random() < 0.01;
  return true;
end;
$$;

revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;

-- 4. Check the result -------------------------------------------------------
-- select tablename, policyname, permissive, cmd, roles, qual, with_check
-- from pg_policies where schemaname = 'public' order by tablename, policyname;
