-- Migration: Add missing columns and tables for production POS
-- 1. Add SKU to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;

-- 2. Table: store_settings
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL DEFAULT 'Toko Saya',
    store_address TEXT DEFAULT 'Jl. Raya No. 1',
    store_phone TEXT DEFAULT '08123456789',
    tax_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.110, -- 11% PPN
    currency TEXT NOT NULL DEFAULT 'IDR',
    receipt_footer TEXT DEFAULT 'Terima kasih atas kunjungan Anda!',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed single default store settings if none exists
INSERT INTO public.store_settings (store_name, store_address, store_phone, tax_rate)
SELECT 'Kasir Pintar POS', 'Jl. Bisnis Pintar No. 8, Jakarta', '0812-3456-7890', 0.11
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- 3. Table: discounts
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC(12, 2) NOT NULL CHECK (value > 0),
    min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    max_discount_amount NUMERIC(12, 2),
    start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '1 year'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed initial discounts
INSERT INTO public.discounts (name, code, type, value, min_order_amount, max_discount_amount, is_active)
VALUES 
  ('Diskon Promo Berkah', 'BERKAH10', 'percentage', 10, 50000, 25000, true),
  ('Potongan Hemat 20k', 'HEMAT20K', 'fixed', 20000, 100000, NULL, true),
  ('Diskon Kemerdekaan', 'MERDEKA', 'percentage', 17, 75000, 50000, true)
ON CONFLICT (code) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Policies for store_settings
CREATE POLICY "Store settings viewable by everyone" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Store settings updatable by authenticated" ON public.store_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Store settings insertable by authenticated" ON public.store_settings FOR INSERT WITH CHECK (true);

-- Policies for discounts
CREATE POLICY "Discounts viewable by everyone" ON public.discounts FOR SELECT USING (true);
CREATE POLICY "Discounts manageable by authenticated" ON public.discounts FOR ALL USING (true) WITH CHECK (true);
