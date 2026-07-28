# Supabase Database Setup for Udhari Khata

This directory contains database migration scripts, security policies, and initial setup instructions for your Supabase project.

## Instructions

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2. **Apply Initial Schema Migration**:
   - Open Supabase **SQL Editor**.
   - Copy the contents of `migrations/001_initial_schema.sql` and run it.
3. **Configure Realtime**:
   - Navigate to **Database** -> **Publications** in Supabase Dashboard.
   - Verify that `customers`, `transactions`, and `activity_logs` tables are listed under `supabase_realtime`.
4. **Create First Shop Owner Account**:
   - Register a user via your app or Supabase Auth.
   - Run the SQL in `seed.sql` to promote the user to `role = 'owner'`.
