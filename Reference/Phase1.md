# 🔵 **PHASE 1 — Project Initialization**

## 🎯 **Objective**
Set up the foundational environment, tools, frameworks, authentication, and base structure before touching UI or business logic.

---

## **1.1 Repository Setup**

1.  **Initialize Git:**
    ```bash
    git init
    ```

2.  **Create `.gitignore`:**
    Create a root file `.gitignore` and ensure it includes:
    ```text
    node_modules
    .next
    .env
    .env.local
    .DS_Store
    out
    build
    ```

3.  **Readme:**
    Create `README.md` with:
    ```markdown
    # AI Portfolio with Chatbot
    Personal portfolio with an integrated AI chatbot and live admin takeover capabilities.
    ```

---

## **1.2 Create Next.js Project**

Run the following command in your terminal:

```bash
npx create-next-app@latest ai-portfolio
```

**Select the following options:**
-   Would you like to use TypeScript? **Yes**
-   Would you like to use ESLint? **Yes**
-   Would you like to use Tailwind CSS? **Yes**
-   Would you like to use `src/` directory? **No** (We will use root `app/`)
-   Would you like to use App Router? **Yes**
-   Would you like to customize the default import alias (@/*)? **No**

**Navigate into the directory:**
```bash
cd ai-portfolio
```

---

## **1.3 Install Dependencies**

### **1.3.1 Core Packages**
Install the necessary runtime libraries:
```bash
npm install next-auth @supabase/supabase-js axios zod uuid lucide-react clsx tailwind-merge
```
*   `next-auth`: Authentication for the admin panel.
*   `@supabase/supabase-js`: Client for Supabase DB & Realtime.
*   `axios`: For making API requests (optional if using `fetch`, but good for consistent config).
*   `zod`: For validating API inputs and schema.
*   `uuid`: For generating temporary IDs if needed.
*   `lucide-react`: Icon set.
*   `clsx` & `tailwind-merge`: Utilities for Shadcn UI.

### **1.3.2 UI Components (Shadcn UI)**
Initialize shadcn-ui:
```bash
npx shadcn-ui@latest init
```
**Options:**
-   Style: **Default**
-   Base Color: **Slate**
-   CSS Variables: **Yes**

**Install critical components:**
```bash
npx shadcn-ui@latest add button input card dialog sheet avatar badge scroll-area textarea toast
```

---

## **1.4 Environment Variables**

Create a file named `.env.local` in the root directory. Add the following keys (fill them in during Step 1.5 & 1.6):

```bash
# Supabase - Get these from Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth - Get these from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run-openssl-rand-base64-32-to-generate

# LLM Configuration
LLM_API_KEY=your-huggingface-or-openai-key
```

> **⚠️ WARNING:** Never commit `.env.local` to Git.

---

## **1.5 Supabase Project Setup**

1.  Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Region:** Choose one close to your users.
3.  **Database Password:** generate a strong one and save it.
4.  Once ready, go to **Settings > API**.
    -   Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
    -   Copy `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    -   Copy `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
5.  **Enable Realtime:**
    -   Go to **Database > Replication**.
    -   Ensure the `supabase_realtime` publication is enabled (we will configure tables for it in Phase 2).

---

## **1.6 NextAuth Setup**

1.  **Google Cloud Console:**
    -   Create a new project.
    -   Go to **APIs & Services > OAuth Consent Screen** -> External -> Create.
    -   Go to **Credentials > Create Credentials > OAuth Client ID** (Web Application).
    -   **Authorized JavaScript origins:** `http://localhost:3000`
    -   **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
    -   Copy Client ID and Secret to `.env.local`.

2.  **Create Auth Route:**
    Create file: `app/api/auth/[...nextauth]/route.ts`
    ```typescript
    import NextAuth from "next-auth";
    import GoogleProvider from "next-auth/providers/google";

    const handler = NextAuth({
      providers: [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ],
      callbacks: {
        async signIn({ user }) {
           // RESTRICT ACCESS TO YOUR EMAIL ONLY
           const allowedEmails = ["your-email@gmail.com"];
           return allowedEmails.includes(user.email || "");
        }
      }
    });

    export { handler as GET, handler as POST };
    ```

---

## **1.7 Folder Structure Initialization**

Organize the project folders as follows by implementing empty directories where missing:

```text
/app
  /api               <-- Backend API Routes
    /auth
    /chat
    /admin
  /admin             <-- Admin Dashboard Pages
  /components        <-- React Components
    /ui              <-- shadcn/ui components (auto-generated)
  /hooks             <-- Custom React Hooks (useChat, etc.)
  /lib               <-- Utility functions
    supabase.ts      <-- Supabase Client Setup
    utils.ts         <-- Helper functions
  /types             <-- TypeScript interfaces
```

**Create `lib/supabase.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## **1.8 Basic Routing**

Create the skeletons for the main pages:

1.  **`app/page.tsx`** (Home/Portfolio):
    ```tsx
    export default function Home() {
      return <h1>Portfolio & Chatbot Loading...</h1>
    }
    ```

2.  **`app/admin/page.tsx`** (Dashboard):
    ```tsx
    export default function AdminDashboard() {
      return <h1>Admin Dashboard locked</h1>
    }
    ```

---

## 🟢 **Phase 1 Completion Criteria**

-   [ ] Next.js app running on `http://localhost:3000` without errors.
-   [ ] `.env.local` populated with real keys.
-   [ ] `npx shadcn-ui@latest add button` works works successfully.
-   [ ] Trying to login at `/api/auth/signin` with Google works (even if it just redirects back).
