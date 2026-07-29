-- Migration 002: Safe Multi-Device Ledger Schema, Realtime & SQL View
-- Database: PostgreSQL (Supabase)

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    alternate_name TEXT,
    mobile TEXT,
    address TEXT,
    opening_balance NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    gender TEXT,
    photo_url TEXT,
    recorded_by TEXT,
    created_by UUID DEFAULT '00000000-0000-4000-a000-000000000001'::uuid,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

-- 3. Ensure Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'payment')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_mode TEXT CHECK (payment_mode IS NULL OR payment_mode IN ('cash', 'upi', 'bank_transfer', 'other')),
    description TEXT,
    recorded_by TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID DEFAULT '00000000-0000-4000-a000-000000000001'::uuid,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

-- 4. Add Missing Columns safely if table already existed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='gender') THEN
        ALTER TABLE public.customers ADD COLUMN gender TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='photo_url') THEN
        ALTER TABLE public.customers ADD COLUMN photo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='recorded_by') THEN
        ALTER TABLE public.customers ADD COLUMN recorded_by TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='recorded_by') THEN
        ALTER TABLE public.transactions ADD COLUMN recorded_by TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='deleted_at') THEN
        ALTER TABLE public.transactions ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 5. High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON public.customers(updated_at);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions(deleted_at);

-- 6. Trigger Function for Updated At
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF (TG_OP = 'UPDATE') THEN
        NEW.version = COALESCE(OLD.version, 1) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. SQL View for Real-Time Customer Balances & Totals
CREATE OR REPLACE VIEW public.customer_balances_summary AS
SELECT 
    c.id AS customer_id,
    c.name,
    c.mobile,
    c.opening_balance,
    COALESCE(SUM(CASE WHEN t.type = 'credit' AND t.deleted_at IS NULL THEN t.amount ELSE 0 END), 0) AS total_credit,
    COALESCE(SUM(CASE WHEN t.type = 'payment' AND t.deleted_at IS NULL THEN t.amount ELSE 0 END), 0) AS total_payment,
    (c.opening_balance + COALESCE(SUM(CASE WHEN t.type = 'credit' AND t.deleted_at IS NULL THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'payment' AND t.deleted_at IS NULL THEN t.amount ELSE 0 END), 0)) AS pending_balance,
    COUNT(t.id) FILTER (WHERE t.deleted_at IS NULL) AS transaction_count,
    MAX(t.transaction_date) AS last_transaction_date
FROM public.customers c
LEFT JOIN public.transactions t ON c.id = t.customer_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.mobile, c.opening_balance;

-- 8. Enable Realtime Replication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'customers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;

-- 9. Row Level Security & Permissions
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon and authenticated full access customers" ON public.customers;
CREATE POLICY "Allow anon and authenticated full access customers"
ON public.customers FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and authenticated full access transactions" ON public.transactions;
CREATE POLICY "Allow anon and authenticated full access transactions"
ON public.transactions FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON public.customers TO anon, authenticated, service_role;
GRANT ALL ON public.transactions TO anon, authenticated, service_role;
GRANT SELECT ON public.customer_balances_summary TO anon, authenticated, service_role;
