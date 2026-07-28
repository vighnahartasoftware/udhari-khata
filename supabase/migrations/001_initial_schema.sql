-- Udhari Khata Initial Database Schema Migration
-- Database: PostgreSQL (Supabase)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'staff')) DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    alternate_name TEXT,
    mobile TEXT,
    address TEXT,
    opening_balance NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'payment')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'other')),
    description TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

-- 5. Activity Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('customer', 'transaction', 'profile', 'system')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync')),
    old_value JSONB,
    new_value JSONB,
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON public.customers(updated_at);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON public.transactions(updated_at);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_performed_at ON public.activity_logs(performed_at);

-- 7. Updated_At and Version Increment Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF (TG_OP = 'UPDATE') THEN
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is active
CREATE OR REPLACE FUNCTION public.is_active_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is an owner
CREATE OR REPLACE FUNCTION public.is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'owner' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Allow active authenticated users to view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_active_user(auth.uid()));

CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Customers Policies
CREATE POLICY "Allow active users to view active customers"
ON public.customers FOR SELECT
TO authenticated
USING (public.is_active_user(auth.uid()));

CREATE POLICY "Allow active users to insert customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (
    public.is_active_user(auth.uid()) AND
    created_by = auth.uid()
);

CREATE POLICY "Allow active users to update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (public.is_active_user(auth.uid()))
WITH CHECK (public.is_active_user(auth.uid()));

CREATE POLICY "Only owners can delete customers"
ON public.customers FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));

-- Transactions Policies
CREATE POLICY "Allow active users to view transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (public.is_active_user(auth.uid()));

CREATE POLICY "Allow active users to insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
    public.is_active_user(auth.uid()) AND
    created_by = auth.uid()
);

CREATE POLICY "Allow active users to update transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (public.is_active_user(auth.uid()))
WITH CHECK (public.is_active_user(auth.uid()));

CREATE POLICY "Only owners can hard delete transactions"
ON public.transactions FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));

-- Activity Logs Policies
CREATE POLICY "Allow active users to view activity logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (public.is_active_user(auth.uid()));

CREATE POLICY "Allow active users to insert activity logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (
    public.is_active_user(auth.uid()) AND
    performed_by = auth.uid()
);

-- 10. Enable Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
