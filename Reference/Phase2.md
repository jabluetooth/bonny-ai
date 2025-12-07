# 🔵 **PHASE 2 — Database & Schema Setup (Supabase)**

## 🎯 **Objective**
Build the robust database foundation using PostgreSQL via Supabase. We will define tables, relationships, and Row Level Security (RLS) policies.

---

## **2.1 Database Schema (SQL)**

Run the following SQL in the **Supabase SQL Editor** to create the tables.

### **2.1.1 Core Tables**

```sql
-- 1. USERS (Visitor Tracking)
-- Tracks anonymous visitors who chat
create table users (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now()
);

-- 2. ADMIN (Authorized Users)
-- We manually insert your admin record here later
create table admin (
  id uuid primary key, -- Will match NextAuth User ID or specific UUID
  email text unique not null,
  created_at timestamptz default now()
);

-- 3. CONVERSATIONS
-- Links users to chat sessions
create table conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  assigned_admin_id uuid references admin(id) on delete set null, -- NULL = AI handles it
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. MESSAGES
-- Individual chat messages
-- Sender Type Enum
create type sender_type as enum ('user', 'bot', 'admin');

create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_type sender_type not null,
  content text not null,
  created_at timestamptz default now()
);
```

### **2.1.2 Portfolio Tables**

```sql
-- 5. PROJECTS
create table projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  tech_stack text[], -- Array of strings e.g. ['React', 'Node']
  live_url text,
  github_url text,
  created_at timestamptz default now()
);

-- 6. EXPERIENCE
create table experience (
  id uuid default gen_random_uuid() primary key,
  role text not null,
  company text not null,
  start_date date not null,
  end_date date, -- NULL = Present
  description text,
  created_at timestamptz default now()
);

-- 7. SKILLS
create table skills (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null, -- e.g. 'Frontend', 'Backend'
  created_at timestamptz default now()
);

-- 8. ABOUT
create table about (
  id uuid default gen_random_uuid() primary key,
  bio text not null,
  created_at timestamptz default now()
);
```

---

## **2.2 Row Level Security (RLS)**

Enable RLS on all tables, then apply these policies.

```sql
-- Enable RLS
alter table users enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table projects enable row level security;
alter table experience enable row level security;
alter table skills enable row level security;
alter table about enable row level security;
```

### **Policies**

**1. Public Read Access (Portfolio Data)**
*Anyone can view projects, skills, etc.*
```sql
create policy "Public can view projects" on projects for select using (true);
create policy "Public can view experience" on experience for select using (true);
create policy "Public can view skills" on skills for select using (true);
create policy "Public can view about" on about for select using (true);
```

**2. Anonymous Chat Access**
*We allow the public (anon role) to create users, start conversations, and send messages.*

```sql
-- Users: Allow anon to create a user ID
create policy "Anon can create user" on users for insert with check (true);
create policy "Anon can read own user" on users for select using (true); -- Simplified

-- Conversations: Anon can create and read their own
create policy "Anon create conversation" on conversations for insert with check (true);
create policy "Anon view conversation" on conversations for select using (true); -- Ideally filter by Cookie ID in prod

-- Messages: Anon can insert (send) and read (view)
create policy "Anon insert message" on messages for insert with check (true);
create policy "Anon select message" on messages for select using (true);
```

**3. Admin Full Access**
*For now, if you are using the service_role key in API routes, RLS is bypassed. If using client-side admin logic, we need specific policies relying on `auth.uid()` matching the `admin` table.*

For this Phase, we rely on **Service Role** usage in Next.js Server Actions/API routes for admin mutations, so explicit RLS for admin client-side is optional but recommended:

```sql
-- Example: strict admin policy (requires Auth setup)
-- create policy "Admin full access" on messages for all using (
--   auth.email() = 'your-email@gmail.com'
-- );
```

---

## **2.3 Realtime Configuration**

To allow the frontend to listen for new messages instantly:

1.  Go to **Database > Publications**.
2.  Click **supabase_realtime**.
3.  Toggle **ON** for the following tables:
    -   `messages` (Critical for chat)
    -   `conversations` (Critical for admin dashboard)

---

## 🟢 **Phase 2 Completion Criteria**

-   [ ] All 8 tables created in Supabase Dashboard.
-   [ ] RLS enabled on all tables.
-   [ ] `sender_type` enum created.
-   [ ] Realtime enabled for `messages` and `conversations`.
-   [ ] Tested manually: Can insert a row into `messages` via SQL editor.
