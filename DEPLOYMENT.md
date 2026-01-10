# Deployment Guide for Bonny AI Portfolio

This guide covers deploying your portfolio to production with your IONOS domain.

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] All environment variables ready (see `.env.example`)
- [ ] Supabase project configured with RLS policies
- [ ] OAuth providers configured (Google/GitHub) with production redirect URLs
- [ ] Resend API key for contact form
- [ ] OpenAI or Groq API key for LLM
- [ ] Your admin email set in `MY_EMAIL`

---

## Recommended: Deploy on Vercel + IONOS Domain

Vercel is the best platform for Next.js apps (it's made by the same team). You'll deploy to Vercel and point your IONOS domain to it.

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import your repository
3. Configure environment variables in Vercel dashboard:

   | Variable | Description |
   |----------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `OPENAI_API_KEY` | OpenAI API key (optional if using Groq) |
   | `GROQ_API_KEY` | Groq API key (optional if using OpenAI) |
   | `HF_API_KEY` | HuggingFace API key (optional) |
   | `RESEND_API_KEY` | Resend API key for emails |
   | `MY_EMAIL` | Your admin email address |
   | `NEXT_PUBLIC_APP_URL` | Your domain: `https://your-domain.com` |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

4. Click "Deploy" and wait for the build to complete
5. Note your Vercel URL (e.g., `your-project.vercel.app`)

### Step 3: Connect IONOS Domain to Vercel

1. In Vercel dashboard, go to your project > Settings > Domains
2. Add your IONOS domain (e.g., `your-domain.com` and `www.your-domain.com`)
3. Vercel will show you DNS records to configure

4. In IONOS DNS settings, add these records:

   **For root domain (`your-domain.com`):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

5. Wait for DNS propagation (can take up to 48 hours, usually faster)

### Step 4: Update OAuth Redirect URLs

Update your OAuth providers with the production callback URL:

**Supabase Dashboard > Authentication > URL Configuration:**
- Site URL: `https://your-domain.com`
- Redirect URLs: `https://your-domain.com/auth/callback`

**Google Cloud Console > OAuth 2.0 Client:**
- Authorized redirect URIs: `https://your-domain.com/auth/callback`

**GitHub Developer Settings:**
- Authorization callback URL: `https://your-domain.com/auth/callback`

### Step 5: Update Supabase RLS

Ensure your Supabase Row Level Security policies allow your production domain.

### Step 6: Generate Embeddings

After deployment, run the embedding script to populate your RAG system:

```bash
npm run embed
```

---

## Post-Deployment Verification

Test these features on your production site:

1. [ ] Homepage loads correctly
2. [ ] Chat functionality works (send a message)
3. [ ] Admin login works with your email
4. [ ] OAuth login works (Google/GitHub)
5. [ ] Contact form sends emails
6. [ ] Projects, Skills, Experience sections load
7. [ ] Mobile responsiveness

---

## Alternative: Deploy on IONOS Directly

IONOS offers Node.js hosting, but it requires more manual setup:

1. Build the project: `npm run build`
2. Upload the `.next`, `public`, `package.json`, and `node_modules` folders
3. Configure Node.js to run `npm start`
4. Set environment variables in IONOS hosting panel

**Note:** This is more complex and may have limitations compared to Vercel.

---

## Troubleshooting

### Build Failures
- Check all environment variables are set correctly
- Ensure `RESEND_API_KEY` is configured (now uses lazy initialization)

### OAuth Not Working
- Verify redirect URLs match exactly (including `https://`)
- Check Supabase Site URL is set correctly

### Chat Not Responding
- Verify `OPENAI_API_KEY` or `GROQ_API_KEY` is set
- Check Supabase connection in browser console

### Admin Access Denied
- Ensure `MY_EMAIL` matches your login email exactly
- Check middleware is allowing your email

### Contact Form Not Sending
- Verify `RESEND_API_KEY` is valid
- Check `MY_EMAIL` is set for receiving emails

---

## Security Reminders

1. **Never commit `.env.local`** - it contains secrets
2. **Rotate API keys** if you suspect they're compromised
3. **Monitor Supabase dashboard** for unusual activity
4. **Review OAuth apps** periodically for security

---

## Updating the Site

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically rebuild and deploy.

To update RAG embeddings after content changes:
```bash
npm run embed
```
