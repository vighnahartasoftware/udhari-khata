# Production Deployment Guide - Udhari Khata

This guide details how to deploy **Udhari Khata** to Vercel (primary target), Netlify, or Cloudflare Pages.

---

## 1. Primary Deployment Target: Vercel

### Step-by-Step Vercel Deployment

1. **Push Code to GitHub**:
   Ensure your code is pushed to a GitHub repository.

2. **Import Project in Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your `udhari-khata` GitHub repository.

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   Add the following environment variables in the Vercel Dashboard:
   ```env
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_APP_NAME=Udhari Khata
   VITE_APP_ENV=production
   ```

5. **Deploy**:
   Click **Deploy**. Vercel will automatically build and publish your PWA.

> ℹ️ SPA route rewrites are handled automatically via `vercel.json`.

---

## 2. Alternative Target 1: Netlify

1. Connect your repository at [app.netlify.com](https://app.netlify.com).
2. Set Build Command: `npm run build` and Publish directory: `dist`.
3. Add Environment Variables in **Site Configuration** -> **Environment variables**.
4. Netlify will use `public/_redirects` for single-page app routing.

---

## 3. Alternative Target 2: Cloudflare Pages

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) -> **Workers & Pages**.
2. Select **Connect to Git** -> choose repository.
3. Framework Preset: `Vite`, Build Command: `npm run build`, Output directory: `dist`.
4. Add environment variables and deploy.
