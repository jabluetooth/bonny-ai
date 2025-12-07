# 🔵 **PHASE 7 — Production Deployment**

## 🎯 **Objective**
Go Live. Ensure the application is secure, performant, and accessible to the world.

---

## **7.1 Vercel Deployment**

1.  **Push to Git:**
    Ensure all your changes are committed and pushed to GitHub/GitLab.

2.  **Import to Vercel:**
    -   Go to [vercel.com/new](https://vercel.com/new).
    -   Import your `ai-portfolio` repository.

3.  **Configure Build Settings:**
    -   Framework Preset: **Next.js** (Default)
    -   Root Directory: `./` (Default)

4.  **Environment Variables:**
    Copy the values from your local `.env.local` to Vercel's Environment Variables section.
    
    | Key | Value |
    |---|---|
    | NEXT_PUBLIC_SUPABASE_URL | *from supabase* |
    | NEXT_PUBLIC_SUPABASE_ANON_KEY | *from supabase* |
    | SUPABASE_SERVICE_ROLE_KEY | *from supabase* |
    | GOOGLE_CLIENT_ID | *from google* |
    | GOOGLE_CLIENT_SECRET | *from google* |
    | NEXTAUTH_URL | `https://your-project.vercel.app` (or custom domain) |
    | NEXTAUTH_SECRET | *your generated secret* |
    | LLM_API_KEY | *your-key* |

5.  **Deploy:** Click **Deploy** and wait for the green confetti.

---

## **7.2 OAuth Production Redirects**

Go back to **Google Cloud Console**:
1.  Navigate to **APIs & Services > Credentials**.
2.  Edit your OAuth 2.0 Client.
3.  Add the new Vercel URI to **Authorized redirect URIs**:
    `https://your-project.vercel.app/api/auth/callback/google`

---

## **7.3 Supabase Production Setup**

1.  **URL Whitelist:**
    Go to **Authentication > URL Configuration**.
    Add `https://your-project.vercel.app` to **Site URL** and **Redirect URLs**.

2.  **Database Health:**
    Check **Database > Backups** has Point-in-Time Recovery (PITR) enabled if you are on a paid (Pro) plan, or ensure daily backups are running.

3.  **Realtime Quotas:**
    If you expect high traffic, check your concurrent connection limits on the Supabase dashboard.

---

## **7.4 Verification Checklist**

-   [ ] **Public Load**: Visit the Vercel URL. Does the homepage load?
-   [ ] **Chat Test**: Send a message as a guest. Does the AI reply?
-   [ ] **Admin Login**: Go to `/admin`. Does Google Login work?
-   [ ] **Realtime Test**: Open phone + laptop. Chat on phone, watch it appear on laptop admin dashboard.

---

## 🟢 **Phase 7 Completion Criteria**

-   [ ] Site is accessible via public HTTPS URL.
-   [ ] No console errors in Production inspector.
-   [ ] Admin Dashboard is fully functional in production environment.
