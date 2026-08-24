# Bonny-AI

**A conversational portfolio - ask a question instead of clicking through static pages.**

[![Live](https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://www.filheinzrelatorre.com)

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

<br>

<!-- HERO: short GIF (10-15s) of someone typing a question ("what have you built with
     RAG?") into the chat and the response streaming in alongside a UI component
     (a project card or skill chip) rendering in real time. That real-time UI-triggering
     is the actual product idea here, so the demo should show it happening, not just the
     chat text. Save as docs/demo.gif, add here as: -->
<!-- <p align="center"><img src="docs/demo.gif" alt="Bonny-AI demo" width="800"></p> -->

---

## The problem

A static portfolio page makes a visitor hunt for the one project or skill that's relevant to them. Bonny-AI lets them just ask - "have you worked with RAG?", "show me your automation projects" - and get a direct answer plus the matching UI, instead of scrolling.

## What it does

- **Natural-language chat** over a real database of my skills, projects, and experience - not a hardcoded FAQ.
- **Dynamic UI rendering** - the chat's intent detection decides which frontend component to render (a project card, a skill chip row, a timeline) alongside the text response.
- **Admin dashboard** - Google OAuth-gated, for managing the underlying content and reviewing past conversations.
- **Database-first design** - skills, projects, and experience live in Postgres and are queried live, not baked into the frontend at build time.

## Try it

**Live:** [filheinzrelatorre.com](https://www.filheinzrelatorre.com)

Ask it about a specific technology, a past project, or how a particular system was built - no sign-in required to chat.

---

## How it works

The chat pipeline does intent detection on each message first, deciding whether the response needs to pull specific context (a project, a skill set) from Postgres before generating an answer, and whether that response should also trigger a UI component. This keeps responses grounded in real stored data rather than the model inventing details about my own background, and keeps AI usage balanced between deterministic lookups and generative phrasing rather than defaulting to "just ask the LLM everything."

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15, React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Database | Supabase (PostgreSQL, Auth, RLS) |
| LLM | Groq |
| Auth | Google OAuth (admin dashboard) |

## Local setup

```bash
git clone https://github.com/jabluetooth/bonny-ai.git
cd bonny-ai
npm install
cp .env.example .env
npm run dev
```

---

## About the developer

**Fil Heinz O. Re La Torre** - Automation & AI Solutions Engineer, building integrations and AI-backed workflows that go from idea to production in days.

[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://www.filheinzrelatorre.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://ph.linkedin.com/in/filheinzrelatorre)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jabluetooth)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:filheinz27@gmail.com)

**Other projects:** [Match](https://github.com/jabluetooth/match) · [ZeroPress](https://github.com/jabluetooth/zeropress) · [Mimo](https://github.com/jabluetooth/mimo) · [Insight](https://github.com/jabluetooth/insight) · [see all →](https://github.com/jabluetooth)

## License

MIT - see [LICENSE](LICENSE)
