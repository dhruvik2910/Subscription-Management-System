// server/db/database.js - SQLite connection & seed initialization
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data folder exists (use /tmp on Vercel serverless to avoid EROFS read-only filesystem error)
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel 
  ? os.tmpdir() 
  : path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'subscriptions.db');

let dbInstance;
try {
  const { DatabaseSync } = await import('node:sqlite');
  dbInstance = new DatabaseSync(dbPath);
  dbInstance.pragma = (str) => dbInstance.exec('PRAGMA ' + str);
  dbInstance.transaction = (fn) => (...args) => {
    dbInstance.exec('BEGIN');
    try {
      const res = fn(...args);
      dbInstance.exec('COMMIT');
      return res;
    } catch (err) {
      dbInstance.exec('ROLLBACK');
      throw err;
    }
  };
} catch (e) {
  const { default: BetterSqlite } = await import('better-sqlite3');
  dbInstance = new BetterSqlite(dbPath);
}

export const db = dbInstance;

// Enable WAL mode for concurrent read/write performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDatabase() {
  let schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve('server/db/schema.sql');
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  seedInitialData();
}

function seedInitialData() {
  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already initialized
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, phone, company)
    VALUES (@id, @name, @email, @password_hash, @role, @phone, @company)
  `);

  const insertStaff = db.prepare(`
    INSERT INTO staff_members (id, name, email, role_title, department, status, added_by)
    VALUES (@id, @name, @email, @role_title, @department, @status, @added_by)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, category, base_price, description, sac_code)
    VALUES (@id, @name, @category, @base_price, @description, @sac_code)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, variant_name, extra_price, sku)
    VALUES (@id, @product_id, @variant_name, @extra_price, @sku)
  `);

  const insertPlan = db.prepare(`
    INSERT INTO plans (id, name, billing_period, interval_count, auto_close_days, description)
    VALUES (@id, @name, @billing_period, @interval_count, @auto_close_days, @description)
  `);

  const insertTemplate = db.prepare(`
    INSERT INTO quotation_templates (id, name, validity_days, default_plan_id, description)
    VALUES (@id, @name, @validity_days, @default_plan_id, @description)
  `);

  const insertTemplateItem = db.prepare(`
    INSERT INTO template_items (id, template_id, product_id, variant_id, quantity, unit_price, discount_percent)
    VALUES (@id, @template_id, @product_id, @variant_id, @quantity, @unit_price, @discount_percent)
  `);

  const insertSub = db.prepare(`
    INSERT INTO subscriptions (id, subscription_number, customer_id, customer_name, customer_email, customer_company, customer_gstin, plan_id, plan_name, billing_period, start_date, next_billing_date, end_date, status, is_paused, auto_renew, tier, total_amount, addons_json)
    VALUES (@id, @subscription_number, @customer_id, @customer_name, @customer_email, @customer_company, @customer_gstin, @plan_id, @plan_name, @billing_period, @start_date, @next_billing_date, @end_date, @status, @is_paused, @auto_renew, @tier, @total_amount, @addons_json)
  `);

  const insertSubLine = db.prepare(`
    INSERT INTO subscription_lines (id, subscription_id, product_name, variant_name, quantity, unit_price, discount_percent, subtotal)
    VALUES (@id, @subscription_id, @product_name, @variant_name, @quantity, @unit_price, @discount_percent, @subtotal)
  `);

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (id, invoice_number, subscription_id, customer_name, customer_email, customer_gstin, invoice_date, due_date, status, subtotal, discount_amount, gst_rate, gst_amount, total_amount, amount_paid, balance_due, cycle_token, sent_at)
    VALUES (@id, @invoice_number, @subscription_id, @customer_name, @customer_email, @customer_gstin, @invoice_date, @due_date, @status, @subtotal, @discount_amount, @gst_rate, @gst_amount, @total_amount, @amount_paid, @balance_due, @cycle_token, @sent_at)
  `);

  const insertInvoiceLine = db.prepare(`
    INSERT INTO invoice_lines (id, invoice_id, description, sac_code, quantity, unit_price, amount)
    VALUES (@id, @invoice_id, @description, @sac_code, @quantity, @unit_price, @amount)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (id, payment_number, invoice_id, invoice_number, customer_name, amount, payment_method, transaction_reference, payment_date, status, notes)
    VALUES (@id, @payment_number, @invoice_id, @invoice_number, @customer_name, @amount, @payment_method, @transaction_reference, @payment_date, @status, @notes)
  `);

  const insertDiscount = db.prepare(`
    INSERT INTO discount_rules (id, code, description, discount_type, discount_value, min_purchase_amount, valid_from, valid_to, max_uses, used_count)
    VALUES (@id, @code, @description, @discount_type, @discount_value, @min_purchase_amount, @valid_from, @valid_to, @max_uses, @used_count)
  `);

  const insertBillingRun = db.prepare(`
    INSERT INTO billing_runs (id, run_date, subscriptions_scanned, invoices_generated, duplicates_prevented, skipped_cycles, total_amount_billed, duration_ms, status)
    VALUES (@id, @run_date, @subscriptions_scanned, @invoices_generated, @duplicates_prevented, @skipped_cycles, @total_amount_billed, @duration_ms, @status)
  `);

  // Transaction for atomic seeding
  const seedTransaction = db.transaction(() => {
    // 1. Users
    insertUser.run({
      id: 'usr-admin',
      name: 'Elena Rostova',
      email: 'elena@brightloop.io',
      password_hash: 'BrightloopAdmin@2024#',
      role: 'admin',
      phone: '+91 98201 44521',
      company: 'Brightloop Technologies India Pvt Ltd'
    });

    insertUser.run({
      id: 'usr-staff',
      name: 'Rohan Mehta',
      email: 'rohan@brightloop.io',
      password_hash: 'BrightloopStaff@2024#',
      role: 'staff',
      phone: '+91 98450 11982',
      company: 'Brightloop Technologies India Pvt Ltd'
    });

    insertUser.run({
      id: 'usr-cust-1',
      name: 'Aarav Patel',
      email: 'aarav@apexretail.in',
      password_hash: 'ApexRetail@2024#',
      role: 'customer',
      phone: '+91 98795 33210',
      company: 'Apex Retail Pvt Ltd'
    });

    // 2. Staff Members
    insertStaff.run({
      id: 'staff-1',
      name: 'Rohan Mehta',
      email: 'rohan@brightloop.io',
      role_title: 'Senior Billing Operations Specialist',
      department: 'Finance & Invoicing',
      status: 'active',
      added_by: 'usr-admin'
    });

    insertStaff.run({
      id: 'staff-2',
      name: 'Priya Sundaram',
      email: 'priya.s@brightloop.io',
      role_title: 'Subscription Account Manager',
      department: 'Customer Success',
      status: 'active',
      added_by: 'usr-admin'
    });

    insertStaff.run({
      id: 'staff-3',
      name: 'Kavita Nair',
      email: 'kavita.n@brightloop.io',
      role_title: 'Revenue Reconciliation Associate',
      department: 'Finance & Invoicing',
      status: 'active',
      added_by: 'usr-admin'
    });

    // 3. Products
    insertProduct.run({
      id: 'prod-saas-core',
      name: 'Brightloop Core Suite',
      category: 'Software License',
      base_price: 3499.00,
      description: 'Centralized recurring billing, subscription tracking, and GST invoicing software.',
      sac_code: '998313'
    });

    insertProduct.run({
      id: 'prod-api-addon',
      name: 'High-Volume Webhook & API Add-on',
      category: 'Developer Add-on',
      base_price: 1250.00,
      description: 'Direct REST API access, webhooks, and custom integration endpoints.',
      sac_code: '998314'
    });

    insertProduct.run({
      id: 'prod-sla-premium',
      name: '24/7 Dedicated Priority Support SLA',
      category: 'Service Level Agreement',
      base_price: 2500.00,
      description: 'Guaranteed 15-minute response time with dedicated technical account manager.',
      sac_code: '998319'
    });

    // 4. Product Variants (Odoo Brand Variant adds ₹560 per Odoo specification)
    insertVariant.run({
      id: 'var-core-standard',
      product_id: 'prod-saas-core',
      variant_name: 'Standard Cloud Edition',
      extra_price: 0.00,
      sku: 'BL-CORE-STD'
    });

    insertVariant.run({
      id: 'var-core-odoo',
      product_id: 'prod-saas-core',
      variant_name: 'Odoo Connected Edition',
      extra_price: 560.00, // Per Odoo PDF spec
      sku: 'BL-CORE-ODOO'
    });

    insertVariant.run({
      id: 'var-core-enterprise',
      product_id: 'prod-saas-core',
      variant_name: 'Enterprise Dedicated Single-Tenant',
      extra_price: 2400.00,
      sku: 'BL-CORE-ENT'
    });

    // 5. Recurring Plans (Daily, Weekly, Monthly, Yearly)
    insertPlan.run({
      id: 'plan-daily',
      name: 'Daily High-Frequency Plan',
      billing_period: 'daily',
      interval_count: 1,
      auto_close_days: 3,
      description: 'Billed every 24 hours for dynamic compute or micro-services.'
    });

    insertPlan.run({
      id: 'plan-weekly',
      name: 'Weekly Flexible Plan',
      billing_period: 'weekly',
      interval_count: 1,
      auto_close_days: 7,
      description: 'Billed every 7 days for sprint or temporary agile contracts.'
    });

    insertPlan.run({
      id: 'plan-monthly',
      name: 'Monthly Professional Plan',
      billing_period: 'monthly',
      interval_count: 1,
      auto_close_days: 15,
      description: 'Standard recurring monthly billing on the 1st or anniversary date.'
    });

    insertPlan.run({
      id: 'plan-yearly',
      name: 'Annual Enterprise Plan',
      billing_period: 'yearly',
      interval_count: 1,
      auto_close_days: 30,
      description: 'Annual upfront subscription with priority SLAs and dedicated database.'
    });

    // 6. Quotation Template (30-day default validity)
    insertTemplate.run({
      id: 'tmpl-standard-saas',
      name: 'Standard B2B SaaS Onboarding Package',
      validity_days: 30,
      default_plan_id: 'plan-monthly',
      description: 'Pre-configures Brightloop Core Suite + Odoo Edition + Priority SLA for fast quote creation.'
    });

    // 7. Template Items
    insertTemplateItem.run({
      id: 'ti-1',
      template_id: 'tmpl-standard-saas',
      product_id: 'prod-saas-core',
      variant_id: 'var-core-odoo',
      quantity: 1,
      unit_price: 4059.00, // 3499 + 560
      discount_percent: 5.0
    });

    insertTemplateItem.run({
      id: 'ti-2',
      template_id: 'tmpl-standard-saas',
      product_id: 'prod-sla-premium',
      variant_id: null,
      quantity: 1,
      unit_price: 2500.00,
      discount_percent: 0.0
    });

    // 8. Initial Subscriptions
    insertSub.run({
      id: 'sub-8842',
      subscription_number: 'SUB-8842',
      customer_id: 'usr-admin',
      customer_name: 'Nexus Techworks LLP',
      customer_email: 'finance@nexustechworks.in',
      customer_company: 'Nexus Techworks LLP',
      customer_gstin: '27AABCN8491K1Z3',
      plan_id: 'plan-monthly',
      plan_name: 'Monthly Professional Plan',
      billing_period: 'monthly',
      start_date: '2024-01-01',
      next_billing_date: '2024-11-01',
      end_date: null,
      status: 'active',
      is_paused: 0,
      auto_renew: 1,
      tier: 'Enterprise',
      total_amount: 6559.00,
      addons_json: JSON.stringify({ analytics: true, support: true })
    });

    insertSubLine.run({
      id: 'sline-8842-1',
      subscription_id: 'sub-8842',
      product_name: 'Brightloop Core Suite (Odoo Connected Edition)',
      variant_name: 'Odoo Edition (+₹560)',
      quantity: 1,
      unit_price: 4059.00,
      discount_percent: 0.0,
      subtotal: 4059.00
    });

    insertSubLine.run({
      id: 'sline-8842-2',
      subscription_id: 'sub-8842',
      product_name: '24/7 Dedicated Priority Support SLA',
      variant_name: 'Standard SLA',
      quantity: 1,
      unit_price: 2500.00,
      discount_percent: 0.0,
      subtotal: 2500.00
    });

    insertSub.run({
      id: 'sub-7719',
      subscription_number: 'SUB-7719',
      customer_id: 'usr-cust-1',
      customer_name: 'Apex Retail Pvt Ltd',
      customer_email: 'aarav@apexretail.in',
      customer_company: 'Apex Retail Pvt Ltd',
      customer_gstin: '24AAGCA1234N1Z5',
      plan_id: 'plan-monthly',
      plan_name: 'Monthly Professional Plan',
      billing_period: 'monthly',
      start_date: '2024-03-15',
      next_billing_date: '2024-11-15',
      end_date: null,
      status: 'active',
      is_paused: 0,
      auto_renew: 1,
      tier: 'Business',
      total_amount: 4749.00,
      addons_json: JSON.stringify({ analytics: true, support: true })
    });

    insertSubLine.run({
      id: 'sline-7719-1',
      subscription_id: 'sub-7719',
      product_name: 'Brightloop Core Suite',
      variant_name: 'Standard Cloud Edition',
      quantity: 1,
      unit_price: 3499.00,
      discount_percent: 0.0,
      subtotal: 3499.00
    });

    insertSubLine.run({
      id: 'sline-7719-2',
      subscription_id: 'sub-7719',
      product_name: 'High-Volume Webhook & API Add-on',
      variant_name: 'Standard Add-on',
      quantity: 1,
      unit_price: 1250.00,
      discount_percent: 0.0,
      subtotal: 1250.00
    });

    insertSub.run({
      id: 'sub-6501',
      subscription_number: 'SUB-6501',
      customer_id: null,
      customer_name: 'Vanguard Logistics India',
      customer_email: 'accounts@vanguardlogistics.in',
      customer_company: 'Vanguard Logistics India',
      customer_gstin: '29AABCV9941P1ZB',
      plan_id: 'plan-yearly',
      plan_name: 'Annual Enterprise Plan',
      billing_period: 'yearly',
      start_date: '2024-06-01',
      next_billing_date: '2025-06-01',
      end_date: '2025-06-01',
      status: 'active',
      is_paused: 0,
      auto_renew: 1,
      tier: 'Enterprise',
      total_amount: 45000.00,
      addons_json: JSON.stringify({ analytics: true, support: true })
    });

    insertSubLine.run({
      id: 'sline-6501-1',
      subscription_id: 'sub-6501',
      product_name: 'Brightloop Core Suite (Annual License)',
      variant_name: 'Enterprise Dedicated Single-Tenant',
      quantity: 1,
      unit_price: 45000.00,
      discount_percent: 0.0,
      subtotal: 45000.00
    });

    insertSub.run({
      id: 'sub-9104',
      subscription_number: 'SUB-9104',
      customer_id: null,
      customer_name: 'BlueHorizon Consulting',
      customer_email: 'billing@bluehorizon.co.in',
      customer_company: 'BlueHorizon Consulting',
      customer_gstin: '27AABCB9123M1Z2',
      plan_id: 'plan-monthly',
      plan_name: 'Monthly Professional Plan',
      billing_period: 'monthly',
      start_date: '2024-02-10',
      next_billing_date: '2024-09-10',
      end_date: '2024-10-10',
      status: 'closed',
      is_paused: 0,
      auto_renew: 0,
      tier: 'Standard',
      total_amount: 3499.00,
      addons_json: JSON.stringify({ analytics: false, support: false })
    });

    // 9. Initial Invoices
    // Invoice 1 - Paid
    insertInvoice.run({
      id: 'inv-2024-001',
      invoice_number: 'INV-2024-001',
      subscription_id: 'sub-8842',
      customer_name: 'Nexus Techworks LLP',
      customer_email: 'finance@nexustechworks.in',
      customer_gstin: '27AABCN8491K1Z3',
      invoice_date: '2024-10-01',
      due_date: '2024-10-15',
      status: 'paid',
      subtotal: 6559.00,
      discount_amount: 0.00,
      gst_rate: 18.00,
      gst_amount: 1180.62,
      total_amount: 7739.62,
      amount_paid: 7739.62,
      balance_due: 0.00,
      cycle_token: 'sub-8842-2024-10-01',
      sent_at: '2024-10-01 10:00:00'
    });

    insertInvoiceLine.run({
      id: 'iline-001-1',
      invoice_id: 'inv-2024-001',
      description: 'Brightloop Core Suite (Odoo Connected Edition)',
      sac_code: '998313',
      quantity: 1,
      unit_price: 4059.00,
      amount: 4059.00
    });

    insertInvoiceLine.run({
      id: 'iline-001-2',
      invoice_id: 'inv-2024-001',
      description: '24/7 Dedicated Priority Support SLA',
      sac_code: '998319',
      quantity: 1,
      unit_price: 2500.00,
      amount: 2500.00
    });

    // Payment for Invoice 1
    insertPayment.run({
      id: 'pay-2024-8842',
      payment_number: 'PAY-2024-8842',
      invoice_id: 'inv-2024-001',
      invoice_number: 'INV-2024-001',
      customer_name: 'Nexus Techworks LLP',
      amount: 7739.62,
      payment_method: 'UPI',
      transaction_reference: 'UPI/HDFC/429810488219',
      payment_date: '2024-10-05',
      status: 'success',
      notes: 'Cleared via UPI AutoPay (HDFC Bank)'
    });

    // Invoice 2 - Overdue
    insertInvoice.run({
      id: 'inv-2024-002',
      invoice_number: 'INV-2024-002',
      subscription_id: 'sub-7719',
      customer_name: 'Apex Retail Pvt Ltd',
      customer_email: 'aarav@apexretail.in',
      customer_gstin: '24AAGCA1234N1Z5',
      invoice_date: '2024-10-05',
      due_date: '2024-10-20',
      status: 'overdue',
      subtotal: 4749.00,
      discount_amount: 0.00,
      gst_rate: 18.00,
      gst_amount: 854.82,
      total_amount: 5603.82,
      amount_paid: 0.00,
      balance_due: 5603.82,
      cycle_token: 'sub-7719-2024-10-05',
      sent_at: '2024-10-05 11:30:00'
    });

    insertInvoiceLine.run({
      id: 'iline-002-1',
      invoice_id: 'inv-2024-002',
      description: 'Brightloop Core Suite (Standard Cloud)',
      sac_code: '998313',
      quantity: 1,
      unit_price: 3499.00,
      amount: 3499.00
    });

    insertInvoiceLine.run({
      id: 'iline-002-2',
      invoice_id: 'inv-2024-002',
      description: 'High-Volume Webhook & API Add-on',
      sac_code: '998314',
      quantity: 1,
      unit_price: 1250.00,
      amount: 1250.00
    });

    // Invoice 3 - Confirmed Draft
    insertInvoice.run({
      id: 'inv-2024-003',
      invoice_number: 'INV-2024-003',
      subscription_id: 'sub-6501',
      customer_name: 'Vanguard Logistics India',
      customer_email: 'accounts@vanguardlogistics.in',
      customer_gstin: '29AABCV9941P1ZB',
      invoice_date: '2024-10-22',
      due_date: '2024-11-06',
      status: 'confirmed',
      subtotal: 45000.00,
      discount_amount: 2250.00, // 5% discount
      gst_rate: 18.00,
      gst_amount: 7695.00,
      total_amount: 50445.00,
      amount_paid: 0.00,
      balance_due: 50445.00,
      cycle_token: 'sub-6501-2024-10-22',
      sent_at: '2024-10-22 14:15:00'
    });

    insertInvoiceLine.run({
      id: 'iline-003-1',
      invoice_id: 'inv-2024-003',
      description: 'Brightloop Core Suite (Annual Enterprise Contract)',
      sac_code: '998313',
      quantity: 1,
      unit_price: 45000.00,
      amount: 45000.00
    });

    // 10. Discount Rules
    insertDiscount.run({
      id: 'disc-diwali',
      code: 'DIWALI20',
      description: 'Diwali Festive 20% discount on first 3 billing cycles',
      discount_type: 'percent',
      discount_value: 20.0,
      min_purchase_amount: 2500.0,
      valid_from: '2024-10-01',
      valid_to: '2027-12-31',
      max_uses: 200,
      used_count: 34
    });

    insertDiscount.run({
      id: 'disc-annual',
      code: 'STARTUP500',
      description: 'Flat ₹500 discount for verified MSME / startup accounts',
      discount_type: 'fixed',
      discount_value: 500.0,
      min_purchase_amount: 3000.0,
      valid_from: '2024-01-01',
      valid_to: '2027-12-31',
      max_uses: 500,
      used_count: 142
    });

    // 11. Initial Billing Run Log
    insertBillingRun.run({
      id: 'BR-2024-10-01',
      run_date: '2024-10-01 00:01:00',
      subscriptions_scanned: 412,
      invoices_generated: 412,
      duplicates_prevented: 0,
      skipped_cycles: 0,
      total_amount_billed: 318490.50,
      duration_ms: 142,
      status: 'completed'
    });
  });

  seedTransaction();
  console.log('✓ SQLite database initialized and seeded with Brightloop INR data.');
}

// Call on startup
initDatabase();
