-- Brightloop Subscription & Billing Database Schema
-- Optimized for SQLite with better-sqlite3

PRAGMA foreign_keys = ON;

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'staff', 'customer')) NOT NULL DEFAULT 'customer',
    phone TEXT,
    company TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Internal Staff Members (Admin only access)
CREATE TABLE IF NOT EXISTS staff_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role_title TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
    added_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id)
);

-- 3. Software Products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    base_price REAL NOT NULL,
    description TEXT,
    sac_code TEXT DEFAULT '998313',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Variants (e.g. Odoo Edition adds ₹560)
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    extra_price REAL NOT NULL DEFAULT 0.0,
    sku TEXT UNIQUE,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. Recurring Billing Plans (Daily, Weekly, Monthly, Yearly)
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    billing_period TEXT CHECK(billing_period IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
    interval_count INTEGER DEFAULT 1,
    auto_close_days INTEGER DEFAULT 15,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Quotation Templates (Pre-populates lines with 30-day default validity)
CREATE TABLE IF NOT EXISTS quotation_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    validity_days INTEGER DEFAULT 30,
    default_plan_id TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (default_plan_id) REFERENCES plans(id)
);

-- 7. Quotation Template Line Items
CREATE TABLE IF NOT EXISTS template_items (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    discount_percent REAL DEFAULT 0.0,
    FOREIGN KEY (template_id) REFERENCES quotation_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- 8. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    subscription_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_company TEXT,
    customer_gstin TEXT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    billing_period TEXT CHECK(billing_period IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
    start_date DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    end_date DATE,
    status TEXT CHECK(status IN ('draft', 'quotation', 'confirmed', 'active', 'closed')) NOT NULL DEFAULT 'quotation',
    is_paused INTEGER DEFAULT 0,
    auto_renew INTEGER DEFAULT 1,
    tier TEXT DEFAULT 'Standard',
    total_amount REAL NOT NULL DEFAULT 0.0,
    addons_json TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 9. Subscription Line Items
CREATE TABLE IF NOT EXISTS subscription_lines (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    discount_percent REAL DEFAULT 0.0,
    subtotal REAL NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- 10. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    subscription_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_gstin TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK(status IN ('draft', 'confirmed', 'paid', 'overdue', 'cancelled')) NOT NULL DEFAULT 'draft',
    subtotal REAL NOT NULL,
    discount_amount REAL DEFAULT 0.0,
    gst_rate REAL DEFAULT 18.0,
    gst_amount REAL NOT NULL,
    total_amount REAL NOT NULL,
    amount_paid REAL DEFAULT 0.0,
    balance_due REAL NOT NULL,
    cycle_token TEXT,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

-- 11. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_lines (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    description TEXT NOT NULL,
    sac_code TEXT DEFAULT '998313',
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 12. Payments Received (UPI, Net Banking, Cards, NEFT/RTGS)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    payment_number TEXT UNIQUE NOT NULL,
    invoice_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('UPI', 'Net Banking', 'Credit/Debit Card', 'NEFT/RTGS', 'Cheque')) NOT NULL,
    transaction_reference TEXT,
    payment_date DATE NOT NULL,
    status TEXT DEFAULT 'success',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 13. Discount Rules
CREATE TABLE IF NOT EXISTS discount_rules (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT CHECK(discount_type IN ('fixed', 'percent')) NOT NULL,
    discount_value REAL NOT NULL,
    min_purchase_amount REAL DEFAULT 0.0,
    valid_from DATE,
    valid_to DATE,
    max_uses INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

-- 14. Billing Runs (Automated Cycle Runs)
CREATE TABLE IF NOT EXISTS billing_runs (
    id TEXT PRIMARY KEY,
    run_date DATETIME NOT NULL,
    subscriptions_scanned INTEGER NOT NULL,
    invoices_generated INTEGER NOT NULL,
    duplicates_prevented INTEGER NOT NULL,
    skipped_cycles INTEGER NOT NULL,
    total_amount_billed REAL NOT NULL,
    duration_ms INTEGER NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_cycle_token ON invoices(cycle_token);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
