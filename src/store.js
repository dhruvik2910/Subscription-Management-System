// src/store.js - Central Store for Brightloop Subscription Management System
// Connected to Express + SQLite backend with seamless in-memory fallback

const STORAGE_KEY = 'brightloop_billing_store_v2';
const API_BASE = 'http://localhost:3001/api';

const INITIAL_DATA = {
  isServerConnected: false,
  currentRole: 'admin', // 'admin' | 'staff' | 'customer'
  activeRoute: 'revenue-operations',
  
  currentUser: {
    admin: {
      name: 'Elena Rostova',
      title: 'Admin (Finance Lead)',
      email: 'elena@brightloop.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
    },
    staff: {
      name: 'Rohan Mehta',
      title: 'Sales & Billing Operations',
      email: 'rohan@brightloop.io',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80'
    },
    customer: {
      name: 'Aarav Patel',
      title: 'Head of Operations • Apex Retail Pvt Ltd',
      email: 'aarav@apexretail.in',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80'
    }
  },

  staffMembers: [
    { id: 'staff-1', name: 'Rohan Mehta', email: 'rohan@brightloop.io', role_title: 'Senior Billing Operations Specialist', department: 'Finance & Invoicing', status: 'active' },
    { id: 'staff-2', name: 'Priya Sundaram', email: 'priya.s@brightloop.io', role_title: 'Subscription Account Manager', department: 'Customer Success', status: 'active' },
    { id: 'staff-3', name: 'Kavita Nair', email: 'kavita.n@brightloop.io', role_title: 'Revenue Reconciliation Associate', department: 'Finance & Invoicing', status: 'active' }
  ],

  products: [
    {
      id: 'prod-saas-core',
      name: 'Brightloop Core Suite',
      category: 'Software License',
      base_price: 3499.00,
      description: 'Centralized recurring billing, subscription tracking, and GST invoicing software.',
      sac_code: '998313',
      variants: [
        { id: 'var-core-standard', variant_name: 'Standard Cloud Edition', extra_price: 0.00, sku: 'BL-CORE-STD' },
        { id: 'var-core-odoo', variant_name: 'Odoo Connected Edition', extra_price: 560.00, sku: 'BL-CORE-ODOO' }, // +₹560 per spec
        { id: 'var-core-enterprise', variant_name: 'Enterprise Dedicated Single-Tenant', extra_price: 2400.00, sku: 'BL-CORE-ENT' }
      ]
    },
    {
      id: 'prod-api-addon',
      name: 'High-Volume Webhook & API Add-on',
      category: 'Developer Add-on',
      base_price: 1250.00,
      description: 'Direct REST API access, webhooks, and custom integration endpoints.',
      sac_code: '998314',
      variants: [
        { id: 'var-api-std', variant_name: 'Standard API', extra_price: 0.00, sku: 'BL-API-STD' }
      ]
    },
    {
      id: 'prod-sla-premium',
      name: '24/7 Dedicated Priority Support SLA',
      category: 'Service Level Agreement',
      base_price: 2500.00,
      description: 'Guaranteed 15-minute response time with dedicated technical account manager.',
      sac_code: '998319',
      variants: [
        { id: 'var-sla-std', variant_name: 'Standard SLA', extra_price: 0.00, sku: 'BL-SLA-STD' }
      ]
    }
  ],

  plans: [
    {
      id: 'plan-daily',
      name: 'Daily High-Frequency Plan',
      billing_period: 'daily',
      interval_count: 1,
      auto_close_days: 3,
      description: 'Billed every 24 hours for dynamic compute or micro-services.'
    },
    {
      id: 'plan-weekly',
      name: 'Weekly Flexible Plan',
      billing_period: 'weekly',
      interval_count: 1,
      auto_close_days: 7,
      description: 'Billed every 7 days for sprint or temporary agile contracts.'
    },
    {
      id: 'plan-monthly',
      name: 'Monthly Professional Plan',
      billing_period: 'monthly',
      interval_count: 1,
      auto_close_days: 15,
      description: 'Standard recurring monthly billing on the 1st or anniversary date.'
    },
    {
      id: 'plan-yearly',
      name: 'Annual Enterprise Plan',
      billing_period: 'yearly',
      interval_count: 1,
      auto_close_days: 30,
      description: 'Annual upfront subscription with priority SLAs and dedicated database.'
    }
  ],

  discountRules: [
    {
      id: 'disc-diwali',
      code: 'DIWALI20',
      description: 'Diwali Festive 20% discount on first 3 billing cycles',
      discount_type: 'percent',
      discount_value: 20.0,
      min_purchase_amount: 2500.0,
      valid_from: '2024-10-01',
      valid_to: '2024-11-30',
      max_uses: 200,
      used_count: 34
    },
    {
      id: 'disc-annual',
      code: 'STARTUP500',
      description: 'Flat ₹500 discount for verified MSME / startup accounts',
      discount_type: 'fixed',
      discount_value: 500.0,
      min_purchase_amount: 3000.0,
      valid_from: '2024-01-01',
      valid_to: '2025-12-31',
      max_uses: 500,
      used_count: 142
    }
  ],

  subscriptions: [
    {
      id: 'sub-8842',
      subscriptionNumber: 'SUB-8842',
      customerName: 'Nexus Techworks LLP',
      customerEmail: 'finance@nexustechworks.in',
      customerCompany: 'Nexus Techworks LLP',
      customerGstin: '27AABCN8491K1Z3',
      planId: 'plan-monthly',
      planName: 'Monthly Professional Plan',
      billingPeriod: 'monthly',
      startDate: '2024-01-01',
      nextBillingDate: '2024-11-01',
      status: 'active',
      isPaused: false,
      autoRenew: true,
      tier: 'Enterprise',
      totalAmount: 6559.00,
      addonsEnabled: { analytics: true, support: true },
      lines: [
        { product_name: 'Brightloop Core Suite (Odoo Connected Edition)', variant_name: 'Odoo Edition (+₹560)', quantity: 1, unit_price: 4059.00, subtotal: 4059.00 },
        { product_name: '24/7 Dedicated Priority Support SLA', variant_name: 'Standard SLA', quantity: 1, unit_price: 2500.00, subtotal: 2500.00 }
      ]
    },
    {
      id: 'sub-7719',
      subscriptionNumber: 'SUB-7719',
      customerName: 'Apex Retail Pvt Ltd',
      customerEmail: 'aarav@apexretail.in',
      customerCompany: 'Apex Retail Pvt Ltd',
      customerGstin: '24AAGCA1234N1Z5',
      planId: 'plan-monthly',
      planName: 'Monthly Professional Plan',
      billingPeriod: 'monthly',
      startDate: '2024-03-15',
      nextBillingDate: '2024-11-15',
      status: 'active',
      isPaused: false,
      autoRenew: true,
      tier: 'Business',
      totalAmount: 4749.00,
      addonsEnabled: { analytics: true, support: true },
      lines: [
        { product_name: 'Brightloop Core Suite', variant_name: 'Standard Cloud Edition', quantity: 1, unit_price: 3499.00, subtotal: 3499.00 },
        { product_name: 'High-Volume Webhook & API Add-on', variant_name: 'Standard Add-on', quantity: 1, unit_price: 1250.00, subtotal: 1250.00 }
      ]
    },
    {
      id: 'sub-6501',
      subscriptionNumber: 'SUB-6501',
      customerName: 'Vanguard Logistics India',
      customerEmail: 'accounts@vanguardlogistics.in',
      customerCompany: 'Vanguard Logistics India',
      customerGstin: '29AABCV9941P1ZB',
      planId: 'plan-yearly',
      planName: 'Annual Enterprise Plan',
      billingPeriod: 'yearly',
      startDate: '2024-06-01',
      nextBillingDate: '2025-06-01',
      status: 'active',
      isPaused: false,
      autoRenew: true,
      tier: 'Enterprise',
      totalAmount: 45000.00,
      addonsEnabled: { analytics: true, support: true },
      lines: [
        { product_name: 'Brightloop Core Suite (Annual License)', variant_name: 'Enterprise Dedicated Single-Tenant', quantity: 1, unit_price: 45000.00, subtotal: 45000.00 }
      ]
    },
    {
      id: 'sub-9104',
      subscriptionNumber: 'SUB-9104',
      customerName: 'BlueHorizon Consulting',
      customerEmail: 'billing@bluehorizon.co.in',
      customerCompany: 'BlueHorizon Consulting',
      customerGstin: '27AABCB9123M1Z2',
      planId: 'plan-monthly',
      planName: 'Monthly Professional Plan',
      billingPeriod: 'monthly',
      startDate: '2024-02-10',
      nextBillingDate: '2024-09-10',
      status: 'closed',
      isPaused: false,
      autoRenew: false,
      tier: 'Standard',
      totalAmount: 3499.00,
      addonsEnabled: { analytics: false, support: false },
      lines: [
        { product_name: 'Brightloop Core Suite', variant_name: 'Standard Cloud Edition', quantity: 1, unit_price: 3499.00, subtotal: 3499.00 }
      ]
    }
  ],

  invoices: [
    {
      id: 'inv-2024-001',
      invoiceNumber: 'INV-2024-001',
      subscriptionId: 'sub-8842',
      customerName: 'Nexus Techworks LLP',
      customerEmail: 'finance@nexustechworks.in',
      customerGstin: '27AABCN8491K1Z3',
      invoiceDate: '2024-10-01',
      dueDate: '2024-10-15',
      status: 'paid',
      subtotal: 6559.00,
      discountAmount: 0.00,
      gstRate: 18.0,
      gstAmount: 1180.62,
      totalAmount: 7739.62,
      amountPaid: 7739.62,
      balanceDue: 0.00,
      paymentMethod: 'UPI',
      lines: [
        { description: 'Brightloop Core Suite (Odoo Connected Edition)', sac_code: '998313', quantity: 1, unit_price: 4059.00, amount: 4059.00 },
        { description: '24/7 Dedicated Priority Support SLA', sac_code: '998319', quantity: 1, unit_price: 2500.00, amount: 2500.00 }
      ]
    },
    {
      id: 'inv-2024-002',
      invoiceNumber: 'INV-2024-002',
      subscriptionId: 'sub-7719',
      customerName: 'Apex Retail Pvt Ltd',
      customerEmail: 'aarav@apexretail.in',
      customerGstin: '24AAGCA1234N1Z5',
      invoiceDate: '2024-10-05',
      dueDate: '2024-10-20',
      status: 'paid',
      subtotal: 4749.00,
      discountAmount: 0.00,
      gstRate: 18.0,
      gstAmount: 854.82,
      totalAmount: 5603.82,
      amountPaid: 5603.82,
      balanceDue: 0.00,
      paymentMethod: 'UPI',
      lines: [
        { description: 'Brightloop Core Suite (Standard Cloud)', sac_code: '998313', quantity: 1, unit_price: 3499.00, amount: 3499.00 },
        { description: 'High-Volume Webhook & API Add-on', sac_code: '998314', quantity: 1, unit_price: 1250.00, amount: 1250.00 }
      ]
    },
    {
      id: 'inv-2024-003',
      invoiceNumber: 'INV-2024-003',
      subscriptionId: 'sub-6501',
      customerName: 'Vanguard Logistics India',
      customerEmail: 'accounts@vanguardlogistics.in',
      customerGstin: '29AABCV9941P1ZB',
      invoiceDate: '2024-10-22',
      dueDate: '2024-11-06',
      status: 'confirmed',
      subtotal: 45000.00,
      discountAmount: 2250.00,
      gstRate: 18.0,
      gstAmount: 7695.00,
      totalAmount: 50445.00,
      amountPaid: 0.00,
      balanceDue: 50445.00,
      paymentMethod: null,
      lines: [
        { description: 'Brightloop Core Suite (Annual Enterprise Contract)', sac_code: '998313', quantity: 1, unit_price: 45000.00, amount: 45000.00 }
      ]
    }
  ],

  payments: [
    {
      id: 'pay-2024-8842',
      paymentNumber: 'PAY-2024-8842',
      invoiceNumber: 'INV-2024-001',
      customerName: 'Nexus Techworks LLP',
      amount: 7739.62,
      method: 'UPI',
      date: '2024-10-05',
      note: 'Cleared via UPI AutoPay (HDFC Bank)'
    },
    {
      id: 'pay-2024-7719',
      paymentNumber: 'PAY-2024-7719',
      invoiceNumber: 'INV-2024-002',
      customerName: 'Apex Retail Pvt Ltd',
      amount: 5603.82,
      method: 'UPI',
      date: '2024-10-31',
      note: 'Settled via Google Pay UPI'
    }
  ],

  billingRuns: [
    {
      id: 'BR-2024-10-01',
      date: '01 Oct 2024, 00:01 IST',
      status: 'Completed',
      subscriptionsProcessed: 3,
      invoicesGenerated: 3,
      duplicatesPrevented: 0,
      skippedCycles: 0,
      executionTimeMs: 12,
      totalBilled: 63788.44
    }
  ]
};

class Store {
  constructor() {
    this.listeners = [];
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.loadState();
    this.initBackendSync();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Retain fresh defaults while preserving custom route or role
        this.state.currentRole = parsed.currentRole || 'admin';
        this.state.activeRoute = parsed.activeRoute || 'revenue-operations';
      }
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentRole: this.state.currentRole,
        activeRoute: this.state.activeRoute
      }));
    } catch (e) {
      console.error('Failed to persist store', e);
    }
    this.notify();
  }

  // Sync with SQLite backend on startup
  async initBackendSync() {
    try {
      const res = await fetch(`${API_BASE}/overview`, { signal: AbortSignal.timeout(2000) });
      if (!res.ok) throw new Error('Backend offline');
      const overviewData = await res.json();

      const [subsRes, invRes, staffRes, productsRes, plansRes, discountsRes, templatesRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE}/subscriptions`).catch(() => null),
        fetch(`${API_BASE}/invoices`).catch(() => null),
        fetch(`${API_BASE}/staff`).catch(() => null),
        fetch(`${API_BASE}/products`).catch(() => null),
        fetch(`${API_BASE}/plans`).catch(() => null),
        fetch(`${API_BASE}/discounts`).catch(() => null),
        fetch(`${API_BASE}/templates`).catch(() => null),
        fetch(`${API_BASE}/payments`).catch(() => null)
      ]);

      if (subsRes && subsRes.ok && invRes && invRes.ok) {
        const subsData = await subsRes.json();
        const invData = await invRes.json();
        const staffData = staffRes && staffRes.ok ? await staffRes.json() : null;
        const productsData = productsRes && productsRes.ok ? await productsRes.json() : null;
        const plansData = plansRes && plansRes.ok ? await plansRes.json() : null;
        const discountsData = discountsRes && discountsRes.ok ? await discountsRes.json() : null;
        const templatesData = templatesRes && templatesRes.ok ? await templatesRes.json() : null;
        const paymentsData = paymentsRes && paymentsRes.ok ? await paymentsRes.json() : null;

        // Map backend subscriptions with normalized dual-access properties
        if (subsData.data && subsData.data.length > 0) {
          this.state.subscriptions = subsData.data.map(s => {
            const rawLines = s.lines || [];
            const normalizedLines = rawLines.map((l, idx) => ({
              id: l.id || `sline-${s.id}-${idx}`,
              productId: l.product_id || l.productId,
              productName: l.product_name || l.productName || 'Software License',
              product_name: l.product_name || l.productName || 'Software License',
              variantId: l.variant_id || l.variantId,
              variantName: l.variant_name || l.variantName || 'Standard Edition',
              variant_name: l.variant_name || l.variantName || 'Standard Edition',
              quantity: l.quantity || 1,
              unitPrice: l.unit_price !== undefined ? l.unit_price : (l.unitPrice || 0),
              unit_price: l.unit_price !== undefined ? l.unit_price : (l.unitPrice || 0),
              discountPercent: l.discount_percent || l.discountPercent || 0,
              discount_percent: l.discount_percent || l.discountPercent || 0,
              subtotal: l.subtotal !== undefined ? l.subtotal : ((l.unit_price || 0) * (l.quantity || 1)),
              total: l.subtotal !== undefined ? l.subtotal : ((l.unit_price || 0) * (l.quantity || 1))
            }));

            const subtotal = s.total_amount || 0;
            const taxTotal = subtotal * 0.18;
            const grandTotal = subtotal + taxTotal;

            return {
              id: s.id,
              subscriptionNumber: s.subscription_number,
              subscription_number: s.subscription_number,
              customerName: s.customer_name,
              customer_name: s.customer_name,
              customerEmail: s.customer_email,
              customer_email: s.customer_email,
              customerCompany: s.customer_company,
              customer_company: s.customer_company,
              customerGstin: s.customer_gstin,
              customer_gstin: s.customer_gstin,
              planId: s.plan_id,
              plan_id: s.plan_id,
              planName: s.plan_name,
              plan_name: s.plan_name,
              billingPeriod: s.billing_period,
              billing_period: s.billing_period,
              startDate: s.start_date,
              start_date: s.start_date,
              nextBillingDate: s.next_billing_date,
              next_billing_date: s.next_billing_date,
              status: s.status,
              isPaused: Boolean(s.is_paused),
              is_paused: Boolean(s.is_paused),
              autoRenew: Boolean(s.auto_renew),
              auto_renew: Boolean(s.auto_renew),
              tier: s.tier || 'Standard',
              totalAmount: subtotal,
              total_amount: subtotal,
              subtotal: subtotal,
              taxTotal: taxTotal,
              discountTotal: 0,
              grandTotal: grandTotal,
              addonsEnabled: s.addons || { analytics: true, support: true },
              lines: normalizedLines,
              items: normalizedLines
            };
          });
        }

        // Map backend invoices
        if (invData.data && invData.data.length > 0) {
          this.state.invoices = invData.data.map(i => ({
            id: i.id,
            invoiceNumber: i.invoice_number,
            invoice_number: i.invoice_number,
            subscriptionId: i.subscription_id,
            subscription_id: i.subscription_id,
            customerName: i.customer_name,
            customer_name: i.customer_name,
            customerEmail: i.customer_email,
            customer_email: i.customer_email,
            customerGstin: i.customer_gstin,
            customer_gstin: i.customer_gstin,
            invoiceDate: i.invoice_date,
            issueDate: i.invoice_date,
            dueDate: i.due_date,
            due_date: i.due_date,
            status: i.status,
            subtotal: i.subtotal,
            discountAmount: i.discount_amount || 0,
            discount_amount: i.discount_amount || 0,
            gstRate: i.gst_rate || 18.0,
            gstAmount: i.gst_amount,
            taxAmount: i.gst_amount,
            taxRate: i.gst_rate || 18.0,
            totalAmount: i.total_amount,
            total_amount: i.total_amount,
            amountPaid: i.amount_paid || 0,
            amount_paid: i.amount_paid || 0,
            balanceDue: i.balance_due,
            balance_due: i.balance_due,
            paymentMethod: i.payment_method,
            cycleToken: i.cycle_token,
            lines: (i.lines || []).map(il => ({
              id: il.id,
              description: il.description,
              sacCode: il.sac_code || '998313',
              sac_code: il.sac_code || '998313',
              quantity: il.quantity || 1,
              qty: il.quantity || 1,
              unitPrice: il.unit_price,
              unit_price: il.unit_price,
              total: il.amount,
              amount: il.amount
            }))
          }));
        }

        // Map payments (full table or fallback to recentPayments)
        if (paymentsData && paymentsData.data && paymentsData.data.length > 0) {
          this.state.payments = paymentsData.data.map(p => ({
            id: p.id,
            paymentNumber: p.payment_number,
            payment_number: p.payment_number,
            invoiceId: p.invoice_id,
            invoice_id: p.invoice_id,
            invoiceNumber: p.invoice_number,
            invoice_number: p.invoice_number,
            customerName: p.customer_name,
            customer_name: p.customer_name,
            amount: p.amount,
            method: p.payment_method,
            payment_method: p.payment_method,
            date: p.payment_date,
            payment_date: p.payment_date,
            note: p.notes,
            notes: p.notes,
            status: p.status
          }));
        } else if (overviewData.data && overviewData.data.recentPayments) {
          this.state.payments = overviewData.data.recentPayments.map(p => ({
            id: p.id,
            paymentNumber: p.payment_number,
            payment_number: p.payment_number,
            invoiceId: p.invoice_id,
            invoice_id: p.invoice_id,
            invoiceNumber: p.invoice_number,
            invoice_number: p.invoice_number,
            customerName: p.customer_name,
            customer_name: p.customer_name,
            amount: p.amount,
            method: p.payment_method,
            payment_method: p.payment_method,
            date: p.payment_date,
            payment_date: p.payment_date,
            note: p.notes,
            notes: p.notes,
            status: p.status
          }));
        }

        if (staffData && staffData.data && staffData.data.length > 0) {
          this.state.staffMembers = staffData.data;
        }

        if (productsData && productsData.data && productsData.data.length > 0) {
          this.state.products = productsData.data.map(p => ({
            ...p,
            salesPrice: p.base_price,
            variants: (p.variants || []).map(v => ({
              ...v,
              name: v.variant_name,
              priceModifier: v.extra_price
            }))
          }));
        }

        if (plansData && plansData.data && plansData.data.length > 0) {
          this.state.plans = plansData.data.map(pl => ({
            ...pl,
            recurrence: pl.billing_period,
            price: pl.base_price || 0
          }));
        }

        if (discountsData && discountsData.data && discountsData.data.length > 0) {
          this.state.discountRules = discountsData.data.map(d => ({
            ...d,
            name: d.description || d.code,
            type: d.discount_type,
            value: d.discount_value,
            minSubtotal: d.min_purchase_amount
          }));
        }

        if (templatesData && templatesData.data && templatesData.data.length > 0) {
          this.state.quotationTemplates = templatesData.data.map(t => ({
            id: t.id,
            name: t.name,
            validityDays: t.validity_days,
            planId: t.default_plan_id,
            description: t.description,
            items: (t.items || []).map(ti => ({
              id: ti.id,
              productId: ti.product_id,
              productName: ti.product_name,
              variantId: ti.variant_id,
              variantName: ti.variant_name,
              quantity: ti.quantity || 1,
              unitPrice: ti.unit_price,
              discountPercent: ti.discount_percent || 0
            }))
          }));
        }

        this.state.isServerConnected = true;
        console.log('✓ Brightloop Frontend synchronized with SQLite backend.');
        this.notify();
      }
    } catch (err) {
      console.warn('Backend sync warning: Running with local memory state.', err.message);
      this.state.isServerConnected = false;
      this.notify();
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Store listener error', err);
      }
    }
  }

  getState() {
    return this.state;
  }

  // --- ACTIONS ---

  setRole(role) {
    this.state.currentRole = role;
    if (role === 'customer') {
      this.state.activeRoute = 'customer-portal';
    } else if (this.state.activeRoute === 'customer-portal') {
      this.state.activeRoute = 'revenue-operations';
    }
    this.saveState();
  }

  setRoute(route) {
    this.state.activeRoute = route;
    this.saveState();
  }

  // Staff Management (Admin Only)
  async addStaffMember({ name, email, roleTitle, department }) {
    if (this.state.currentRole !== 'admin') {
      throw new Error('Only the admin can add a new member of staff.');
    }

    try {
      if (this.state.isServerConnected) {
        const res = await fetch(`${API_BASE}/staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, roleTitle, department })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      }
    } catch (e) {
      console.warn('Server staff add fallback to local:', e.message);
    }

    const newStaff = {
      id: 'staff-' + Date.now(),
      name,
      email,
      role_title: roleTitle || 'Billing Specialist',
      department: department || 'Finance & Invoicing',
      status: 'active'
    };
    this.state.staffMembers.unshift(newStaff);
    this.saveState();
    return newStaff;
  }

  // Subscriptions Lifecycle
  async updateSubscriptionStatus(subId, newStatus) {
    const sub = this.state.subscriptions.find(s => s.id === subId);
    if (sub) {
      sub.status = newStatus;
      this.saveState();

      if (this.state.isServerConnected) {
        try {
          await fetch(`${API_BASE}/subscriptions/${subId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
        } catch (e) {
          console.warn('Status patch error:', e);
        }
      }
    }
  }

  async toggleSubscriptionPause(subId) {
    const sub = this.state.subscriptions.find(s => s.id === subId);
    if (sub) {
      sub.isPaused = !sub.isPaused;
      this.saveState();

      if (this.state.isServerConnected) {
        try {
          await fetch(`${API_BASE}/subscriptions/${subId}/toggle-pause`, { method: 'PATCH' });
        } catch (e) {
          console.warn('Pause toggle error:', e);
        }
      }
    }
  }

  async addSubscription(newSub) {
    this.state.subscriptions.unshift(newSub);
    this.saveState();

    if (this.state.isServerConnected) {
      try {
        await fetch(`${API_BASE}/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSub)
        });
      } catch (e) {
        console.warn('Add sub error:', e);
      }
    }
  }

  // Customer Add-on Toggle
  async toggleCustomerAddon(subId, addonType) {
    const sub = this.state.subscriptions.find(s => s.id === subId);
    if (!sub) return;

    if (!sub.addonsEnabled) {
      sub.addonsEnabled = { analytics: true, support: true };
    }

    sub.addonsEnabled[addonType] = !sub.addonsEnabled[addonType];

    // Recalculate total dynamically based on base product lines and configured add-ons
    const baseItemsTotal = (sub.lines || sub.items || []).reduce((acc, l) => {
      const price = l.unit_price !== undefined ? l.unit_price : (l.unitPrice || 0);
      const qty = l.quantity || l.qty || 1;
      return acc + (price * qty);
    }, 0) || 3499.00;

    let extra = 0;
    if (sub.addonsEnabled.analytics) extra += 1250.00;
    if (sub.addonsEnabled.support) extra += 2500.00;
    
    sub.totalAmount = baseItemsTotal + extra;
    sub.subtotal = sub.totalAmount;
    sub.taxTotal = sub.totalAmount * 0.18;
    sub.grandTotal = sub.totalAmount * 1.18;

    this.saveState();

    if (this.state.isServerConnected) {
      try {
        await fetch(`${API_BASE}/subscriptions/${subId}/addons`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addonKey: addonType, enabled: sub.addonsEnabled[addonType] })
        });
      } catch (e) {
        console.warn('Addon patch error:', e);
      }
    }
  }

  // Catalog: Product Variant Management
  async addProductVariant(productId, variantData) {
    const product = this.state.products.find(p => p.id === productId);
    if (!product) return null;

    if (!product.variants) product.variants = [];
    const priceModifier = variantData.priceModifier !== undefined ? variantData.priceModifier : (variantData.extra_price || 0);
    const varName = variantData.name || variantData.variant_name || 'New Variant';
    
    const newVariant = {
      id: variantData.id || 'var-' + Date.now(),
      product_id: productId,
      name: varName,
      variant_name: varName,
      priceModifier: priceModifier,
      extra_price: priceModifier,
      sku: variantData.sku || `BL-VAR-${Date.now().toString().slice(-4)}`,
      is_active: 1
    };
    product.variants.push(newVariant);
    this.saveState();

    if (this.state.isServerConnected) {
      try {
        await fetch(`${API_BASE}/products/${productId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantName: varName,
            extraPrice: priceModifier,
            sku: newVariant.sku
          })
        });
      } catch (e) {
        console.warn('Server variant add fallback:', e.message);
      }
    }
    return newVariant;
  }

  // Catalog: Billing Cadence Plan Management
  async addPlan(planData) {
    const recurrence = planData.recurrence || planData.billing_period || 'monthly';
    const newPlan = {
      id: planData.id || 'plan-' + Date.now(),
      name: planData.name,
      billing_period: recurrence,
      recurrence: recurrence,
      interval_count: planData.interval_count || 1,
      price: planData.price || 0,
      base_price: planData.price || 0,
      min_quantity: planData.minQuantity || planData.min_quantity || 1,
      minQuantity: planData.minQuantity || planData.min_quantity || 1,
      auto_close_days: planData.auto_close_days || (planData.autoClose ? 15 : 0),
      autoClose: Boolean(planData.autoClose),
      allow_pause: planData.allowPause !== undefined ? (planData.allowPause ? 1 : 0) : 1,
      allowPause: planData.allowPause !== undefined ? Boolean(planData.allowPause) : true,
      description: planData.description || `Configured ${recurrence} cadence.`,
      is_active: 1
    };

    this.state.plans.push(newPlan);
    this.saveState();

    if (this.state.isServerConnected) {
      try {
        await fetch(`${API_BASE}/plans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPlan)
        });
      } catch (e) {
        console.warn('Server plan add fallback:', e.message);
      }
    }
    return newPlan;
  }

  // Catalog: Discount Rule Management
  async addDiscountRule(discountData) {
    const val = discountData.value !== undefined ? discountData.value : (discountData.discount_value || 0);
    const minSub = discountData.minSubtotal !== undefined ? discountData.minSubtotal : (discountData.min_purchase_amount || 0);
    const code = (discountData.code || '').toUpperCase();
    const type = discountData.type || discountData.discount_type || 'fixed';

    const newRule = {
      id: discountData.id || 'disc-' + Date.now(),
      code: code,
      description: discountData.description || discountData.name || `Promotional rule ${code}`,
      name: discountData.name || discountData.description || code,
      discount_type: type,
      type: type,
      discount_value: val,
      value: val,
      min_purchase_amount: minSub,
      minSubtotal: minSub,
      valid_from: discountData.validFrom || discountData.valid_from || new Date().toISOString().split('T')[0],
      valid_to: discountData.validTo || discountData.valid_to || '2026-12-31',
      max_uses: discountData.maxUses || discountData.max_uses || 100,
      used_count: discountData.currentUses || discountData.used_count || 0,
      scope: discountData.scope || 'whole_subscription',
      is_active: 1
    };

    this.state.discountRules.unshift(newRule);
    this.saveState();

    if (this.state.isServerConnected) {
      try {
        await fetch(`${API_BASE}/admin/discounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRule)
        });
      } catch (e) {
        console.warn('Server discount add fallback:', e.message);
      }
    }
    return newRule;
  }

  // Invoice persistence
  addInvoice(newInv) {
    this.state.invoices.unshift(newInv);
    this.saveState();
  }

  // Authentication & Customer Onboarding
  async registerCustomer({ name, email, password, company, phone }) {
    if (this.state.isServerConnected) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, company, phone })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }
    }

    this.state.currentUser.customer = {
      name: name || 'Valued Customer',
      title: `${company || 'Customer'} • Account Lead`,
      email: email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80'
    };
    this.setRole('customer');
  }

  async login(email, password) {
    if (this.state.isServerConnected) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      const user = data.data;
      if (user.role) {
        this.state.currentUser[user.role] = {
          name: user.name,
          title: user.role === 'admin' ? 'Admin (Finance Lead)' : user.role === 'staff' ? 'Billing Operations' : `${user.company || 'Customer'}`,
          email: user.email,
          avatar: this.state.currentUser[user.role]?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
        };
        this.setRole(user.role);
      }
      return user;
    } else {
      // Offline fallback
      const role = email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'customer';
      this.setRole(role);
      return { email, role };
    }
  }

  // Invoices & Payments
  async recordPayment({ invoiceNumber, amount, method, note }) {
    const inv = this.state.invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (!inv) return false;

    const payAmount = parseFloat(amount) || inv.balanceDue;
    inv.amountPaid += payAmount;
    inv.balanceDue = Math.max(0, inv.totalAmount - inv.amountPaid);
    
    if (inv.balanceDue <= 0.01) {
      inv.status = 'paid';
      inv.paymentMethod = method;
    }

    const newPayment = {
      id: 'pay-' + Date.now(),
      paymentNumber: 'PAY-' + Math.floor(10000 + Math.random() * 90000),
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      amount: payAmount,
      method: method || 'UPI',
      date: new Date().toISOString().split('T')[0],
      note: note || `Payment received via ${method}`
    };

    this.state.payments.unshift(newPayment);
    this.saveState();

    if (this.state.isServerConnected) {
      try {
        await fetch(`${API_BASE}/invoices/${inv.id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: payAmount, paymentMethod: method, notes: note })
        });
      } catch (e) {
        console.warn('Server payment error:', e);
      }
    }
    return true;
  }

  async confirmInvoice(invoiceNumber) {
    const inv = this.state.invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (inv && inv.status === 'draft') {
      inv.status = 'confirmed';
      this.saveState();

      if (this.state.isServerConnected) {
        try {
          await fetch(`${API_BASE}/invoices/${inv.id}/confirm`, { method: 'POST' });
        } catch (e) {
          console.warn('Confirm invoice error:', e);
        }
      }
    }
  }

  async cancelInvoice(invoiceNumber) {
    const inv = this.state.invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (inv) {
      inv.status = 'cancelled';
      inv.balanceDue = 0.00;
      this.saveState();

      if (this.state.isServerConnected) {
        try {
          await fetch(`${API_BASE}/invoices/${inv.id}/cancel`, { method: 'POST' });
        } catch (e) {
          console.warn('Cancel invoice error:', e);
        }
      }
    }
  }

  // Batch automated recurring billing run
  async runBatchBilling() {
    let result = null;

    if (this.state.isServerConnected) {
      try {
        const res = await fetch(`${API_BASE}/billing/run`, { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          result = json.data;
          // Refresh invoices and overview from backend
          await this.initBackendSync();
          return {
            id: result.runId,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            subscriptionsProcessed: result.subscriptionsScanned,
            invoicesGenerated: result.invoicesGenerated,
            duplicatesPrevented: result.duplicatesPrevented,
            executionTimeMs: result.durationMs,
            totalBilled: result.totalBilled
          };
        }
      } catch (e) {
        console.warn('Backend billing run failed, using local simulation:', e);
      }
    }

    // Local fallback simulation
    const activeSubs = this.state.subscriptions.filter(s => s.status === 'active' && !s.isPaused);
    let createdCount = 0;
    let totalRunAmount = 0;
    const now = new Date();
    const cycleToken = `RUN-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    activeSubs.forEach((sub, idx) => {
      const alreadyBilled = this.state.invoices.some(
        inv => inv.subscriptionId === sub.id && inv.cycleToken === cycleToken
      );

      if (!alreadyBilled) {
        const nextInvNum = `INV-2024-${1030 + this.state.invoices.length}`;
        const issueDate = now.toISOString().split('T')[0];
        const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
        const subtotal = sub.totalAmount;
        const gst = subtotal * 0.18;
        const total = subtotal + gst;

        const newInv = {
          id: 'inv-' + Date.now() + '-' + idx,
          invoiceNumber: nextInvNum,
          subscriptionId: sub.id,
          cycleToken,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          invoiceDate: issueDate,
          issueDate: issueDate,
          dueDate,
          status: 'confirmed',
          subtotal,
          gstRate: 18.0,
          gstAmount: gst,
          taxAmount: gst,
          totalAmount: total,
          amountPaid: 0.00,
          balanceDue: total,
          lines: sub.lines || []
        };

        this.state.invoices.unshift(newInv);
        totalRunAmount += total;
        createdCount++;
      }
    });

    const runRecord = {
      id: `BR-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Completed',
      subscriptionsProcessed: activeSubs.length,
      invoicesGenerated: createdCount,
      duplicatesPrevented: activeSubs.length - createdCount,
      skippedCycles: 0,
      executionTimeMs: 14,
      totalBilled: totalRunAmount
    };

    this.state.billingRuns.unshift(runRecord);
    this.saveState();
    return runRecord;
  }
}

export const store = new Store();
