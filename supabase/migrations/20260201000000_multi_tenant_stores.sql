-- Migration: Multi-tenant SaaS architecture for WECASH

-- 1. Table: stores
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT DEFAULT 'Jl. Raya No. 1',
    phone TEXT DEFAULT '08123456789',
    tax_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.110,
    currency TEXT NOT NULL DEFAULT 'IDR',
    receipt_footer TEXT DEFAULT 'Terima kasih telah berbelanja!',
    subscription_plan TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'pro', 'business')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired')),
    subscription_expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '14 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add store_id to existing tables if not present
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- 3. Default Demo Store for existing demo accounts
INSERT INTO public.stores (id, name, address, phone, subscription_plan, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'WECASH Demo Store', 'Jl. Bisnis Pintar No. 8', '0812-3456-7890', 'pro', 'active')
ON CONFLICT (id) DO NOTHING;

-- Link existing orphaned records to default demo store
UPDATE public.products SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.transactions SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.discounts SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;

-- 4. Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores viewable by everyone" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Stores insertable by authenticated" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Stores updatable by authenticated" ON public.stores FOR UPDATE USING (true) WITH CHECK (true);
