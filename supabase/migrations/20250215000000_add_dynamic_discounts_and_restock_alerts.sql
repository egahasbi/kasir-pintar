-- Enable UUID generation if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create discounts table for dynamic campaign promotions
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    value NUMERIC(12, 2) NOT NULL CHECK (value > 0),
    min_purchase NUMERIC(12, 2) DEFAULT 0.00 CHECK (min_purchase >= 0),
    max_discount NUMERIC(12, 2) DEFAULT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    usage_limit INT DEFAULT NULL CHECK (usage_limit IS NULL OR usage_limit > 0),
    times_used INT NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 2. Create restock_alerts table for inventory low-stock notifications
CREATE TABLE IF NOT EXISTS public.restock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    current_stock INT NOT NULL,
    threshold INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved')),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active_dates ON public.discounts(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_restock_alerts_product_id ON public.restock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_alerts_status ON public.restock_alerts(status);

-- 3. Trigger function to auto-update updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_discounts_updated_at
    BEFORE UPDATE ON public.discounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_restock_alerts_updated_at
    BEFORE UPDATE ON public.restock_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Trigger function for low stock threshold alert creation & auto-resolve
CREATE OR REPLACE FUNCTION public.check_product_stock_threshold()
RETURNS TRIGGER AS $$
DECLARE
    existing_alert_id UUID;
    v_product_name VARCHAR(255);
    v_min_threshold INT;
BEGIN
    v_product_name := NEW.name;
    v_min_threshold := COALESCE(NEW.min_stock, 5);

    -- Check if stock dropped below or equal to threshold
    IF NEW.stock <= v_min_threshold THEN
        -- Check if active alert already exists
        SELECT id INTO existing_alert_id
        FROM public.restock_alerts
        WHERE product_id = NEW.id AND status IN ('unread', 'read')
        LIMIT 1;

        IF existing_alert_id IS NOT NULL THEN
            -- Update existing open alert with current stock
            UPDATE public.restock_alerts
            SET current_stock = NEW.stock,
                threshold = v_min_threshold,
                updated_at = timezone('utc'::text, now())
            WHERE id = existing_alert_id;
        ELSE
            -- Insert fresh alert
            INSERT INTO public.restock_alerts (
                product_id,
                product_name,
                current_stock,
                threshold,
                status
            ) VALUES (
                NEW.id,
                v_product_name,
                NEW.stock,
                v_min_threshold,
                'unread'
            );
        END IF;
    ELSE
        -- If stock restored above threshold, auto-resolve any unread/read alert
        UPDATE public.restock_alerts
        SET status = 'resolved',
            current_stock = NEW.stock,
            resolved_at = timezone('utc'::text, now()),
            updated_at = timezone('utc'::text, now())
        WHERE product_id = NEW.id AND status IN ('unread', 'read');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_stock_threshold ON public.products;
CREATE TRIGGER trigger_check_stock_threshold
    AFTER INSERT OR UPDATE OF stock, min_stock, name ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_product_stock_threshold();

-- 5. Row Level Security policies
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_alerts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full read/write for operational cashiers and managers
CREATE POLICY "Allow authenticated read discounts"
    ON public.discounts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert/update discounts"
    ON public.discounts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated read restock_alerts"
    ON public.restock_alerts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated modify restock_alerts"
    ON public.restock_alerts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public read on valid active discounts for POS client checkout
CREATE POLICY "Allow anon read active discounts"
    ON public.discounts FOR SELECT
    TO anon
    USING (
        is_active = true 
        AND now() BETWEEN start_date AND end_date
        AND (usage_limit IS NULL OR times_used < usage_limit)
    );