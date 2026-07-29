-- Tables for the GitHub-triggered autonomous content agent
-- (app/api/webhooks/github/route.ts + lib/agent-session.ts).
-- Run this once in the Supabase SQL editor. No migrations pipeline exists
-- in this repo yet, so this file is kept for reference/version control.

-- Idempotency: GitHub retries webhook deliveries; this lets the webhook
-- handler drop duplicates before running the agent.
create table if not exists webhook_events (
    id uuid primary key default gen_random_uuid(),
    delivery_id text not null unique,
    created_at timestamptz not null default now()
);

-- Audit trail: every autonomous write the agent makes, so it can be
-- reviewed (and manually reverted from `after`) later.
create table if not exists content_edits_log (
    id uuid primary key default gen_random_uuid(),
    table_name text not null,
    record_id uuid not null,
    action text not null check (action in ('created', 'updated')),
    before jsonb,
    after jsonb,
    github_delivery_id text,
    session_id text,
    created_at timestamptz not null default now()
);

create index if not exists content_edits_log_record_idx
    on content_edits_log (table_name, record_id, created_at desc);

-- Single-row on/off switch for the agent, toggleable from the admin
-- dashboard (Settings → AI Agent) without a redeploy. The webhook handler
-- checks this before doing any work.
create table if not exists agent_settings (
    id smallint primary key default 1,
    enabled boolean not null default true,
    updated_at timestamptz not null default now(),
    constraint agent_settings_singleton check (id = 1)
);
insert into agent_settings (id, enabled) values (1, true) on conflict (id) do nothing;

-- All three tables are read/written only via the service-role admin client
-- (never the browser client), so RLS stays enabled with no permissive
-- policies — the anon/authenticated roles get no access at all.
alter table webhook_events enable row level security;
alter table content_edits_log enable row level security;
alter table agent_settings enable row level security;
