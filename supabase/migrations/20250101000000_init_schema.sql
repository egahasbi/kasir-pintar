-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier');
CREATE TYPE transaction_status AS ENUM ('completed', 'pending', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'qris', 'transfer', 'debit');

-- Table: profiles (mirrors auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'cashier',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= cost_price),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock_alert INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_alert >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    cashier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (final_amount >= 0),
    payment_method payment_method NOT NULL DEFAULT 'cash',
    payment_status transaction_status NOT NULL DEFAULT 'completed',
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    change_given NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (change_given >= 0),
    customer_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: transaction_items
CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: audit_logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_transactions_invoice ON public.transactions(invoice_number);
CREATE INDEX idx_transactions_cashier ON public.transactions(cashier_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transaction_items_tx ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON public.transaction_items(product_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Helper Functions
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'cashier'::user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.deduct_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;

    IF (SELECT stock FROM public.products WHERE id = NEW.product_id) < 0 THEN
        RAISE EXCEPTION 'Stock cannot be negative for product ID: %', NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trigger_deduct_inventory
    AFTER INSERT ON public.transaction_items
    FOR EACH ROW EXECUTE FUNCTION public.deduct_inventory_on_sale();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: profiles
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.get_current_role() = 'owner');

-- RLS Policies: categories
CREATE POLICY "Categories viewable by authenticated users"
    ON public.categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Owners and managers manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'manager'))
    WITH CHECK (public.get_current_role() IN ('owner', 'manager'));

-- RLS Policies: products
CREATE POLICY "Products viewable by authenticated users"
    ON public.products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Owners and managers insert products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (public.get_current_role() IN ('owner', 'manager'));

CREATE POLICY "Owners and managers update products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'manager'))
    WITH CHECK (public.get_current_role() IN ('owner', 'manager'));

CREATE POLICY "Only owners delete products"
    ON public.products FOR DELETE
    TO authenticated
    USING (public.get_current_role() = 'owner');

-- RLS Policies: transactions
CREATE POLICY "Transactions viewable by authenticated staff"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('owner', 'manager') 
        OR cashier_id = auth.uid()
    );

CREATE POLICY "Cashiers, managers, and owners insert transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (cashier_id = auth.uid());

CREATE POLICY "Owners and managers update transactions"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'manager'))
    WITH CHECK (public.get_current_role() IN ('owner', 'manager'));

CREATE POLICY "Only owners delete transactions"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (public.get_current_role() = 'owner');

-- RLS Policies: transaction_items
CREATE POLICY "Items viewable by transaction viewers"
    ON public.transaction_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_items.transaction_id
            AND (public.get_current_role() IN ('owner', 'manager') OR t.cashier_id = auth.uid())
        )
    );

CREATE POLICY "Authenticated users insert transaction items"
    ON public.transaction_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_items.transaction_id
            AND t.cashier_id = auth.uid()
        )
    );

CREATE POLICY "Only owners delete transaction items"
    ON public.transaction_items FOR DELETE
    TO authenticated
    USING (public.get_current_role() = 'owner');

-- RLS Policies: audit_logs
CREATE POLICY "Audit logs viewable only by owners"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.get_current_role() = 'owner');

CREATE POLICY "Authenticated users insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_items;