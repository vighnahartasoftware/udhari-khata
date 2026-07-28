# Production Supabase Setup & Migration Guide - Udhari Khata

> ⚠️ **Note**: Do not perform these steps now. This guide is provided for when you are ready to transition **Udhari Khata** from **Local Demo Mode** (`VITE_DATA_MODE=local`) to live **Supabase Production Mode** (`VITE_DATA_MODE=supabase`).

---

## 📋 Step-by-Step Transition Checklist

### Step 1: Create Supabase Project
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Select your target region.

---

### Step 2: Retrieve API Keys
1. In the Supabase Dashboard, go to **Project Settings** -> **API**.
2. Copy:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **anon / public Key** (Client-safe API key)

> 🔒 **Security Notice**: Never copy or use the `service_role` secret key in frontend environment variables.

---

### Step 3: Run Database Migrations
1. In Supabase Dashboard, open **SQL Editor**.
2. Copy the entire content of `supabase/migrations/001_initial_schema.sql` and click **Run**.
3. Verify that the tables (`profiles`, `customers`, `transactions`, `activity_logs`) and RLS policies are created successfully.

---

### Step 4: Enable Realtime Publications
1. Navigate to **Database** -> **Publications**.
2. Click on `supabase_realtime`.
3. Ensure toggle switches are **ON** for `customers`, `transactions`, and `activity_logs`.

---

### Step 5: Configure Production Environment Variables
Update your production `.env` (or environment variables in Vercel / Netlify dashboard):

```env
VITE_APP_NAME=Udhari Khata
VITE_APP_ENV=production
VITE_DATA_MODE=supabase
VITE_ENABLE_PWA=true

VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

---

### Step 6: Create First Shop Owner Account
1. Open your deployed app and register your shop user via Email & Password.
2. In Supabase SQL Editor, promote the newly registered user to `owner`:
   ```sql
   UPDATE public.profiles
   SET role = 'owner', display_name = 'डेअरी मालक'
   WHERE id = '<USER_UUID_FROM_AUTH_USERS>';
   ```

---

### Step 7: Verify Production Requirements
- Confirm demo credentials (`admin@udhari.local`) are disabled automatically in Supabase mode.
- Confirm realtime cross-device ledger updates between two separate mobile devices.
- Deploy to Vercel/Netlify using `npm run build`.
