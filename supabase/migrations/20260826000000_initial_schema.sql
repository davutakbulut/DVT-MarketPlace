
-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COMPANIES (Tüzel Kişilik / Firma)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(32) NOT NULL,
    tax_office VARCHAR(128),
    address TEXT,
    city VARCHAR(64),
    country VARCHAR(64) DEFAULT 'Turkey',
    phone VARCHAR(32),
    email VARCHAR(255) NOT NULL,
    currency VARCHAR(8) DEFAULT 'TRY',
    billing_plan VARCHAR(32) DEFAULT 'pro',
    subscription_status VARCHAR(32) DEFAULT 'active',
    trial_ends_at TIMESTAMPTZ,
    status VARCHAR(32) DEFAULT 'active',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USER COMPANY ROLES (Admin & User Rolleri)
CREATE TABLE user_company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_user_company UNIQUE (user_id, company_id)
);

-- 3. STORES (Pazaryeri Mağazaları & Hesapları)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    marketplace VARCHAR(32) NOT NULL CHECK (marketplace IN ('trendyol', 'hepsiburada', 'amazon_tr', 'n11', 'pazarama', 'manual')),
    store_name VARCHAR(128) NOT NULL,
    seller_id VARCHAR(64) NOT NULL,
    api_key_enc BYTEA,
    api_secret_enc BYTEA,
    extra_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sync_status VARCHAR(32) DEFAULT 'idle',
    sync_error_message TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. USER STORE PERMISSIONS (Kullanıcı Mağaza & Modül İzinleri)
CREATE TABLE user_store_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"can_view_profit": true, "can_edit_costs": true, "can_update_prices": true, "can_export_reports": true, "allowed_modules": ["dashboard", "live_analysis", "pricing"]}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_user_store UNIQUE (user_id, store_id)
);

-- 5. MARKETPLACE CATEGORIES (Dinamik Komisyon ve Desi Oranları)
CREATE TABLE marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace VARCHAR(32) NOT NULL,
    category_id BIGINT NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    parent_category VARCHAR(255),
    default_commission_rate DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    vat_rate INTEGER NOT NULL DEFAULT 20,
    average_desi DECIMAL(6,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_marketplace_category UNIQUE (marketplace, category_id)
);

-- 6. PRODUCTS (Ürün ve Varyant Kataloğu)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    is_parent BOOLEAN DEFAULT false,
    barcode VARCHAR(64) NOT NULL,
    sku VARCHAR(64),
    model_code VARCHAR(64),
    title VARCHAR(512) NOT NULL,
    category_id UUID REFERENCES marketplace_categories(id) ON DELETE SET NULL,
    brand VARCHAR(128),
    color VARCHAR(64),
    size VARCHAR(64),
    image_url TEXT,
    marketplace_product_url TEXT,
    current_sale_price DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    current_cost DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    cost_currency VARCHAR(8) DEFAULT 'TRY',
    vat_rate INTEGER NOT NULL DEFAULT 20,
    shipment_desi DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    measured_desi DECIMAL(6,2) DEFAULT 1.00,
    commission_rate DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    extra_cost DECIMAL(12,4) DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    return_rate DECIMAL(6,2) DEFAULT 0.00,
    delivery_type VARCHAR(32) DEFAULT 'standard' CHECK (delivery_type IN ('standard', 'fast_delivery', 'same_day_shipping')),
    target_profit_margin_percent DECIMAL(6,2) DEFAULT 20.00,
    target_profit_amount DECIMAL(12,4) DEFAULT 0.00,
    selected_tariff_tier VARCHAR(32) DEFAULT 'standard',
    manual_target_price DECIMAL(12,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_store_barcode UNIQUE (store_id, barcode)
);

-- 7. PRODUCT COST HISTORY (Maliyet Değişiklik Geçmişi)
CREATE TABLE product_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    cost_price DECIMAL(12,4) NOT NULL,
    vat_rate INTEGER NOT NULL DEFAULT 20,
    currency VARCHAR(8) DEFAULT 'TRY',
    effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ,
    change_reason VARCHAR(255),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 8. CARRIER DESI RATES (Kargo Desi Baremleri Matrisi)
CREATE TABLE carrier_desi_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    carrier_name VARCHAR(64) NOT NULL,
    min_desi DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    max_desi DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    base_price DECIMAL(12,4) NOT NULL,
    vat_rate INTEGER NOT NULL DEFAULT 20,
    fixed_return_fee DECIMAL(12,4) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_carrier_desi UNIQUE (company_id, carrier_name, min_desi, max_desi)
);

-- 9. ORDERS (Siparişler)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    marketplace_order_number VARCHAR(64) NOT NULL,
    package_number VARCHAR(64),
    order_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Created',
    delivery_type VARCHAR(32) DEFAULT 'standard',
    customer_name VARCHAR(128),
    customer_city VARCHAR(64),
    customer_country VARCHAR(64) DEFAULT 'Turkey',
    is_micro_export BOOLEAN DEFAULT false,
    original_currency VARCHAR(8) DEFAULT 'TRY',
    exchange_rate DECIMAL(12,4) DEFAULT 1.0000,
    gross_amount DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    total_commission DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    total_shipping_cost DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    service_fee DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    intl_service_fee DECIMAL(12,4) DEFAULT 0.00,
    intl_operation_fee DECIMAL(12,4) DEFAULT 0.00,
    withholding_tax DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    net_vat DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    ad_spend_cost DECIMAL(12,4) DEFAULT 0.00,
    penalty_cost DECIMAL(12,4) DEFAULT 0.00,
    early_payout_cost DECIMAL(12,4) DEFAULT 0.00,
    extra_cost DECIMAL(12,4) DEFAULT 0.00,
    net_profit DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    profit_margin_percent DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    profit_markup_percent DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    has_missing_cost BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_store_order_number UNIQUE (store_id, marketplace_order_number)
);

-- 10. ORDER ITEMS (Sipariş Kalemleri & Kârlılık Defteri)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    barcode VARCHAR(64) NOT NULL,
    sku VARCHAR(64),
    title VARCHAR(512) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_sale_price DECIMAL(12,4) NOT NULL,
    unit_cost_price DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    unit_cost_vat_rate INTEGER NOT NULL DEFAULT 20,
    sale_vat_rate INTEGER NOT NULL DEFAULT 20,
    commission_rate DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    shipping_desi DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    expected_desi DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    shipping_amount DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    expected_shipping_amount DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    service_fee_share DECIMAL(12,4) DEFAULT 0.00,
    intl_service_fee DECIMAL(12,4) DEFAULT 0.00,
    intl_operation_fee DECIMAL(12,4) DEFAULT 0.00,
    withholding_tax DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    output_vat DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    input_vat DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    net_vat DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    extra_cost DECIMAL(12,4) DEFAULT 0.00,
    ad_spend_share DECIMAL(12,4) DEFAULT 0.00,
    penalty_share DECIMAL(12,4) DEFAULT 0.00,
    early_payout_share DECIMAL(12,4) DEFAULT 0.00,
    net_profit DECIMAL(12,4) NOT NULL DEFAULT 0.00,
    margin_percent DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    has_missing_cost BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(32) DEFAULT 'active'
);

-- 11. DAILY FINANCIAL ROLLUPS (Anasayfa Hızlı Agregasyon Tablosu)
CREATE TABLE daily_financial_rollups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    rollup_date DATE NOT NULL,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_items_sold INTEGER NOT NULL DEFAULT 0,
    total_gross_revenue DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_cogs DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_commission DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_shipping_cost DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_service_fee DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_intl_fees DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_withholding DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_net_vat DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_ad_spend DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_penalties DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_early_payout_fee DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_extra_costs DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_net_profit DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    total_returns_count INTEGER NOT NULL DEFAULT 0,
    total_returns_loss DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    missing_cost_items_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_store_daily_rollup UNIQUE (store_id, rollup_date)
);

-- 12. SETTLEMENTS & TRANSACTIONS (Hakediş Bordroları)
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    settlement_period VARCHAR(64) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    gross_sales DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    commission_deduction DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    shipping_deduction DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    service_fee_deduction DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    penalty_deduction DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    ad_deduction DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    early_payout_deduction DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    withholding_deduction DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    net_payout DECIMAL(14,4) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE settlement_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_number VARCHAR(64),
    transaction_type VARCHAR(64) NOT NULL,
    amount DECIMAL(12,4) NOT NULL,
    description TEXT,
    discrepancy_amount DECIMAL(12,4) DEFAULT 0.00,
    discrepancy_type VARCHAR(64) DEFAULT 'none',
    is_audited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. TARIFELER & SİMÜLASYON TABLOLARI
CREATE TABLE commission_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES marketplace_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    tier_1_price_max DECIMAL(12,4),
    tier_1_rate DECIMAL(6,2),
    tier_2_price_max DECIMAL(12,4),
    tier_2_rate DECIMAL(6,2),
    tier_3_price_max DECIMAL(12,4),
    tier_3_rate DECIMAL(6,2),
    tier_4_price_max DECIMAL(12,4),
    tier_4_rate DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plus_commission_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    plus_discount_rate DECIMAL(6,2) NOT NULL,
    plus_commission_rate DECIMAL(6,2) NOT NULL,
    simulated_profit DECIMAL(12,4) NOT NULL,
    profit_margin_percent DECIMAL(6,2) NOT NULL,
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_plus_tariff_product UNIQUE (product_id)
);

CREATE TABLE advantageous_badge_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    avantaj_price DECIMAL(12,4),
    avantaj_profit DECIMAL(12,4),
    cok_avantaj_price DECIMAL(12,4),
    cok_avantaj_profit DECIMAL(12,4),
    super_avantaj_price DECIMAL(12,4),
    super_avantaj_profit DECIMAL(12,4),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_badge_product UNIQUE (product_id)
);

-- 14. SYSTEM ALERTS (Uyarı Listesi)
CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    alert_type VARCHAR(64) NOT NULL CHECK (alert_type IN ('negative_profit', 'low_margin', 'missing_cost', 'high_desi', 'settlement_discrepancy', 'high_return_rate')),
    severity VARCHAR(16) NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'danger')),
    entity_id UUID,
    entity_type VARCHAR(32),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. COMPANY SETTINGS (Firma & Genel Ayarlar)
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    default_vat_rate INTEGER DEFAULT 20,
    default_stopaj_rate DECIMAL(6,2) DEFAULT 1.00,
    default_service_fee DECIMAL(12,4) DEFAULT 8.49,
    default_packaging_cost DECIMAL(12,4) DEFAULT 0.00,
    min_profit_margin_threshold DECIMAL(6,2) DEFAULT 15.00,
    margin_color_thresholds JSONB DEFAULT '{"danger_max": 5.0, "warning_max": 15.0, "success_max": 30.0, "excellent_min": 30.0}'::jsonb,
    alert_email_recipients TEXT[],
    email_daily_summary_enabled BOOLEAN DEFAULT true,
    email_negative_profit_alert BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. ASYNC EXPORT JOBS
CREATE TABLE async_export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    report_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. FINANCIAL AUDIT LOGS
CREATE TABLE financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name VARCHAR(64) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(16) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

