# Supabase Production Setup Checklist - Udhari Khata

Follow this step-by-step checklist to configure your Supabase backend project.

---

## 1. Project Creation
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Select your preferred database region.

## 2. Obtain Credentials
1. Navigate to **Project Settings** -> **API**.
2. Copy:
   - **Project URL**
   - **anon / public Key**

## 3. Run Database Migrations
1. In Supabase Dashboard, open **SQL Editor**.
2. Copy and execute `supabase/migrations/001_initial_schema.sql`.

## 4. Enable Realtime Publications
1. Navigate to **Database** -> **Publications**.
2. Verify `customers`, `transactions`, and `activity_logs` are enabled under `supabase_realtime`.

## 5. Promote First Shop Owner Profile
1. Register your initial user account via your app or Supabase Auth.
2. In SQL Editor, execute `supabase/seed.sql` with your user UUID:
   ```sql
   UPDATE public.profiles
   SET role = 'owner', display_name = 'डेअरी मालक'
   WHERE id = '<YOUR_USER_UUID>';
   ```

## 6. Security Check
- Ensure RLS policies are enabled on all tables.
- **Never** expose `service_role` keys in your frontend application.
