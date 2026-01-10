# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bonny AI is an AI-powered interactive portfolio application built with Next.js 14, featuring a RAG (Retrieval Augmented Generation) chatbot, real-time admin chat management, and a comprehensive content management system. The chatbot uses hybrid intelligence combining deterministic responses, semantic search via vector embeddings, and LLM generation.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build production bundle
- `npm start` - Run production server
- `npm run lint` - Run ESLint

### RAG/Embedding Management
- `npm run embed` - Generate and store vector embeddings for RAG functionality
  - Reads data from Supabase (projects, skills, experiences, profiles)
  - Generates embeddings using HuggingFace's `sentence-transformers/all-MiniLM-L6-v2`
  - Stores in `document_embeddings` table with pgvector
  - **Run this after updating portfolio data to refresh RAG context**

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router, Server Components)
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Auth**: Supabase Auth (OAuth + Email/Password, Anonymous)
- **AI/ML**:
  - LLM: OpenAI GPT-4o-mini (fallback to Groq Llama-3.1)
  - Embeddings: HuggingFace Inference API
  - RAG: Custom implementation with semantic search
- **UI**: React 18, Radix UI (shadcn/ui), TailwindCSS 4, Framer Motion
- **Validation**: Zod schemas
- **Security**: XSS library, CSP headers

### Directory Structure

```
app/
├── (auth)/callback/           # OAuth callback handler
├── admin/                     # Admin dashboard (protected routes)
│   ├── (dashboard)/          # Main admin UI with tabs
│   └── login/                # Admin login page
├── api/                      # API routes
│   ├── chat/                # Chat endpoints (send, start, user)
│   ├── about/               # Portfolio content APIs (author, background, interests, vision)
│   ├── experiences/         # Experience CRUD
│   ├── projects/            # Projects CRUD
│   ├── skills/              # Skills CRUD
│   └── send/                # Contact form email (Resend)
└── page.tsx                 # Public portfolio homepage

components/
├── admin/                   # Admin-only components
│   ├── forms/              # CRUD forms for portfolio data
│   ├── chat-manager.tsx    # Real-time conversation viewer
│   ├── analytics-view.tsx  # Admin analytics dashboard
│   └── settings-view.tsx
├── security/
│   └── disable-devtools.tsx
├── ui/                     # shadcn/ui components
├── chatbox.tsx            # Main chat interface
└── chat-provider.tsx      # Chat context + realtime listeners

lib/
├── supabase-server.ts     # Server-side Supabase client (SSR, cookies)
├── supabase-client.ts     # Browser-side Supabase client
├── llm.ts                 # LLM response generation
├── rag.ts                 # RAG implementation (embeddings + semantic search)
├── chat-context.ts        # Intent-based context fetching
├── chat-responses.ts      # Deterministic response patterns
├── intents.ts             # Chat intent definitions
└── data-cache.ts          # Client-side request cache

scripts/
└── embed-data.ts          # RAG data ingestion script
```

### Authentication Flow

**Three-tier auth system:**
1. **Anonymous Users**: Auto sign-in via Supabase anonymous auth (chat only)
2. **Authenticated Users**: OAuth (GitHub/Google) or email/password
3. **Admin Users**: Email-based validation (`MY_EMAIL` env var)

**Key Files:**
- [middleware.ts](middleware.ts) - Session refresh, route protection, admin email validation
- [app/(auth)/callback/route.ts](app/(auth)/callback/route.ts) - OAuth callback
- [app/admin/login/page.tsx](app/admin/login/page.tsx) - Admin login UI

**Session Management:**
- Cookies expire on browser close (no persistent login)
- Middleware refreshes sessions on every request
- Admin routes protected: redirects to `/admin/login` if unauthorized

### Chat System Architecture

The chatbot uses a **three-tier response strategy**:

```
User Message
    ↓
1. Intent Detection (lib/intents.ts, lib/chat-responses.ts)
   └─ Pattern matching for known queries → Static responses
    ↓
2. Context Fetching (Parallel)
   ├─ Intent-based: Fetch relevant DB data (lib/chat-context.ts)
   └─ RAG-based: Semantic search via embeddings (lib/rag.ts)
    ↓
3. LLM Generation (lib/llm.ts)
   └─ GPT-4o-mini with RAG context + system prompt
```

**Key Implementation Details:**

1. **Intent Detection**: Bypasses LLM for known patterns
   - Examples: `QUERY_PROJECTS_WEB`, `QUERY_SKILLS_FRONTEND`
   - Returns special UI triggers: `[[SHOW_PROJECTS]]`, `[[SKILL: React]]`

2. **RAG System**:
   - **Model**: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)
   - **Storage**: Supabase `document_embeddings` table with pgvector
   - **Search**: RPC function `match_documents` (cosine similarity)
   - **Threshold**: 0.72 similarity score
   - **Caching**: In-memory cache (5-min TTL, max 100 entries)
   - **Data Coverage**: Projects, Skills, Experiences, Author Profiles
   - **Chunking Strategy**: Projects split into overview, tech_stack, challenges chunks

3. **LLM Configuration**:
   - **Primary**: OpenAI GPT-4o-mini
   - **Fallback**: Groq Llama-3.1 (if `GROQ_API_KEY` set)
   - **Temperature**: 0.7
   - **Max Tokens**: 500
   - **System Prompt**: 600+ lines defining personality (Fil Heinz O. Re La Torre)

4. **Real-time Features**:
   - Supabase Realtime listeners for new messages
   - Admin takeover: Disables auto-reply when admin assigned
   - Presence tracking for online users
   - Keep-alive: Database heartbeat every 10s

**Chat Flow** ([app/api/chat/send/route.ts](app/api/chat/send/route.ts)):
```
POST /api/chat/send
├─ XSS sanitization (xss library)
├─ Message limit check (100 max per conversation)
├─ Save user message → Supabase
├─ Check admin mode (skip auto-reply if admin assigned)
├─ Parallel:
│  ├─ Deterministic response check
│  ├─ Intent-based context fetch
│  └─ RAG semantic search
├─ LLM generation (if needed)
└─ Save bot response → Supabase
```

### Admin Dashboard

**Real-time Features**:
- Live conversation monitoring
- Online user presence indicators
- Admin message insertion (visible to users instantly)
- Analytics: conversation counts, engagement metrics

**CRUD Management**:
- Portfolio data: Projects, Skills, Experiences
- About sections: Author profile, Background cards, Interests, Vision
- Chat settings and conversation management

**Key Component**: [components/admin/chat-manager.tsx](components/admin/chat-manager.tsx)

### Security Configuration

**Middleware** ([middleware.ts](middleware.ts)):
- Session refresh on every request
- Admin route protection with email validation
- Session-only cookies (no persistent auth)
- Cache control for dynamic routes

**Next.js Config** ([next.config.mjs](next.config.mjs)):
- **CSP**: Strict policy, allows self + Supabase + Unsplash images
- **HSTS**: 2-year max-age with preload
- **XSS Protection**: `1; mode=block`
- **Frame Options**: `DENY` (prevents clickjacking)
- **Content Type**: `nosniff`

**API Security**:
- XSS sanitization on all chat inputs
- Zod validation on API endpoints
- Rate limiting via message count (100 per conversation)

### Database Schema (Supabase)

**Core Tables**:
- `users` - User profiles
- `conversations` - Chat sessions with admin assignment
- `messages` - Chat history (user/bot/admin)
- `document_embeddings` - Vector embeddings for RAG
- `author_profiles` - Portfolio owner bio
- `projects` - Projects with tech_stack (array), category
- `skills` - Skills with category_id
- `skill_categories` - Skill groupings
- `experiences` - Work/education with type (work/education/achievement)
- `interests` - Personal hobbies
- `background_cards` - Education/milestone cards
- `vision_cards` - Inspirational quotes
- `contact_links` - Social media links

**Realtime Channels**:
- `postgres_changes` listeners on `messages` table
- Presence channel for admin dashboard

### Environment Variables

Required in `.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM
OPENAI_API_KEY=
GROQ_API_KEY=              # Optional fallback

# HuggingFace (optional, works without key for embeddings)
HF_API_KEY=

# OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Admin
MY_EMAIL=                  # Admin email for access validation

# Email
RESEND_API_KEY=           # For contact form
```

## Common Workflows

### Adding New Portfolio Data
1. Update data via admin dashboard UI or directly in Supabase
2. **Run** `npm run embed` to regenerate embeddings
3. Verify RAG search works by testing relevant chat queries

### Modifying Chat Behavior
- **Static responses**: Edit [lib/chat-responses.ts](lib/chat-responses.ts)
- **Intent definitions**: Edit [lib/intents.ts](lib/intents.ts)
- **Context fetching**: Edit [lib/chat-context.ts](lib/chat-context.ts)
- **LLM system prompt**: Edit [lib/llm.ts](lib/llm.ts)
- **RAG parameters**: Edit [lib/rag.ts](lib/rag.ts) (similarity threshold, max results)

### Debugging Chat Issues
1. Check browser console for client errors
2. Check server logs for LLM/RAG errors
3. Verify embeddings exist: Query `document_embeddings` table
4. Test RAG search directly via Supabase RPC `match_documents`
5. Check message limits (100 per conversation)

### Admin Takeover Process
1. Admin assigns conversation in chat manager
2. System sets `conversations.assigned_admin_id`
3. Auto-reply disabled for that conversation
4. Admin messages sent with `sender_type='admin'`
5. User sees admin messages via realtime listener

## Code Patterns

### Supabase Client Usage
- **Server Components/API Routes**: Use `createServerClient` from [lib/supabase-server.ts](lib/supabase-server.ts)
- **Client Components**: Use `createBrowserClient` from [lib/supabase-client.ts](lib/supabase-client.ts)
- **Scripts**: Use `createClient` directly with service role key

### Data Fetching
- Use [lib/data-cache.ts](lib/data-cache.ts) for client-side caching (5-min TTL)
- Always provide fallback mock data in API routes
- Validate with Zod schemas before DB operations

### Real-time Listeners
Pattern from [components/chat-provider.tsx](components/chat-provider.tsx):
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe()
```

### UI Component Triggers
Chat responses can include special syntax to trigger UI components:
- `[[SHOW_PROJECTS]]` - Display projects section
- `[[SHOW_SKILLS]]` - Display skills section
- `[[SKILL: React]]` - Highlight specific skill
- `[[PROJECT: {title}]]` - Highlight specific project

## Testing Considerations

- **Chat flow**: Test anonymous login → message send → response
- **Admin auth**: Verify email validation works
- **RAG accuracy**: Test semantic search returns relevant results
- **Real-time**: Test message delivery with multiple tabs open
- **Security**: Test XSS prevention, CSP enforcement
- **Edge cases**: Test message limits, empty DB state, network errors

## Performance Notes

- **Parallel queries**: Context fetching and RAG search run in parallel
- **Embedding cache**: 5-min TTL prevents redundant API calls
- **Request deduplication**: Client-side cache prevents duplicate API requests
- **Token optimization**: YAML-like context format reduces token usage
- **Lazy loading**: Admin components load on-demand

## Important Constraints

- Message limit: 100 per conversation
- Max message length: 2000 characters
- Embedding dimension: 384 (MiniLM model)
- RAG similarity threshold: 0.72
- LLM max tokens: 500
- Cache TTL: 5 minutes (embeddings and data)
