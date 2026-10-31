// src/store.js - Central Reactive State Store for Brightloop Enterprise Billing

const STORAGE_KEY = 'brightloop_billing_store_v1';

const INITIAL_DATA = {
  currentRole: 'admin', // 'admin' | 'staff' | 'customer'
  activeRoute: 'revenue-operations', // 'revenue-operations' | 'subscriptions-quotes' | 'billing-invoices' | 'products-plans' | 'customer-portal'
  
  currentUser: {
    admin: {
      name: 'Elena Rostova',
      title: 'Admin (Finance Lead)',
      email: 'elena.rostova@brightloop.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
    },
    staff: {
      name: 'Marcus Vance',
      title: 'Sales & Billing Specialist',
      email: 'marcus.vance@brightloop.io',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80'
    },
    customer: {
      name: 'Alex Chen',
      title: 'VP Operations • Apex Retail Inc',
      email: 'alex.chen@apexretail.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80'
    }
  },

  products: [
    {
      id: 'prod-erp-01',
      sku: 'BL-ERP-COR-01',
      name: 'Brightloop ERP Suite',
      type: 'Software',
      category: 'SaaS Core',
      salesPrice: 1000.00,
      costPrice: 120.00,
      notes: 'Multi-tenant cloud ERP backbone with financials, CRM, and inventory core.',
      variants: [
        { id: 'var-std', name: 'Standard Multi-Tenant Cloud', priceModifier: 0.00 },
        { id: 'var-odoo', name: 'Odoo Enterprise Brand Edition', priceModifier: 560.00 }, // Challenge requirement: adds 560 to price
        { id: 'var-gov', name: 'Federal GovCloud Dedicated Enclave', priceModifier: 1200.00 }
      ]
    },
    {
      id: 'prod-analytics-02',
      sku: 'BL-ANL-PRO-02',
      name: 'Brightloop Analytics & Forecasting Pro',
      type: 'Add-on',
      category: 'Analytics',
      salesPrice: 250.00,
      costPrice: 30.00,
      notes: 'Predictive revenue forecasting, automated dunning analytics, and cohort churn models.',
      variants: [
        { id: 'var-std-anl', name: 'Standard Analytics Feed', priceModifier: 0.00 },
        { id: 'var-ai-anl', name: 'GenAI RevOps Assistant Add-on', priceModifier: 150.00 }
      ]
    },
    {
      id: 'prod-support-03',
      sku: 'BL-SUP-247-03',
      name: '24/7 Enterprise Dedicated Support SLA',
      type: 'Service',
      category: 'Support',
      salesPrice: 450.00,
      costPrice: 100.00,
      notes: '15-minute response SLA, dedicated technical account manager, and phone routing.',
      variants: [
        { id: 'var-sla-tier1', name: 'Tier 1 Critical SLA', priceModifier: 0.00 },
        { id: 'var-sla-vip', name: 'Executive White Glove 24/7', priceModifier: 300.00 }
      ]
    }
  ],

  plans: [
    {
      id: 'plan-starter-mo',
      name: 'Starter Monthly Tier',
      recurrence: 'monthly',
      price: 250.00,
      minQuantity: 1,
      availableFrom: '2024-01-01',
      availableTo: '2025-12-31',
      autoClose: false,
      allowPause: true,
      allowRenew: true,
      description: 'Ideal for small agile teams scaling their initial operations.'
    },
    {
      id: 'plan-enterprise-yr',
      name: 'Enterprise Annual Agreement',
      recurrence: 'yearly',
      price: 1200.00,
      minQuantity: 5,
      availableFrom: '2024-01-01',
      availableTo: '2026-12-31',
      autoClose: false,
      allowPause: true,
      allowRenew: true,
      description: 'Comprehensive annual contract with dedicated account management and SLA guarantees.'
    },
    {
      id: 'plan-growth-wk',
      name: 'High-Frequency Burst License',
      recurrence: 'weekly',
      price: 85.00,
      minQuantity: 1,
      availableFrom: '2024-06-01',
      availableTo: '2025-06-01',
      autoClose: true,
      allowPause: false,
      allowRenew: true,
      description: 'Weekly billing plan designed for short-term campaign bursts.'
    },
    {
      id: 'plan-sandbox-day',
      name: 'Daily Dedicated Sandbox',
      recurrence: 'daily',
      price: 15.00,
      minQuantity: 1,
      availableFrom: '2024-01-01',
      availableTo: '2025-12-31',
      autoClose: true,
      allowPause: true,
      allowRenew: false,
      description: 'On-demand staging and sandbox environment billed by the active calendar day.'
    }
  ],

  discountRules: [
    {
      id: 'disc-tier1',
      code: 'TIER1ENTERPRISE',
      name: 'Volume Seat Discount',
      type: 'fixed',
      value: 200.00,
      minSubtotal: 1000.00,
      minQuantity: 5,
      validFrom: '2024-01-01',
      validTo: '2025-12-31',
      maxUses: 100,
      currentUses: 42,
      scope: 'whole_subscription',
      status: 'active'
    },
    {
      id: 'disc-earlybird',
      code: 'EARLYBIRD15',
      name: 'Annual Commitment Incentive',
      type: 'percentage',
      value: 15.0,
      minSubtotal: 500.00,
      minQuantity: 1,
      validFrom: '2024-01-01',
      validTo: '2025-12-31',
      maxUses: 50,
      currentUses: 14,
      scope: 'whole_subscription',
      status: 'active'
    },
    {
      id: 'disc-summer',
      code: 'SUMMERSCALE',
      name: 'Summer Growth Promotion',
      type: 'percentage',
      value: 20.0,
      minSubtotal: 2000.00,
      minQuantity: 10,
      validFrom: '2024-06-01',
      validTo: '2024-08-31',
      maxUses: 20,
      currentUses: 20,
      scope: 'whole_subscription',
      status: 'expired'
    }
  ],

  taxRules: [
    { id: 'tax-us-de', name: 'US Delaware (HQ Exempt)', rate: 0.0, jurisdiction: 'US-DE', active: true },
    { id: 'tax-us-ca', name: 'US California Tech SaaS Tax', rate: 8.25, jurisdiction: 'US-CA', active: true },
    { id: 'tax-eu-ie', name: 'EU VAT Ireland Tech Digital', rate: 23.0, jurisdiction: 'EU-IE', active: true },
    { id: 'tax-uk-vat', name: 'UK Standard VAT', rate: 20.0, jurisdiction: 'GB', active: true },
    { id: 'tax-in-gst', name: 'India GST Software Services', rate: 18.0, jurisdiction: 'IN', active: true }
  ],

  quotationTemplates: [
    {
      id: 'tpl-enterprise-bundle',
      name: 'Enterprise ERP + Odoo Brand Edition Bundle',
      planId: 'plan-enterprise-yr',
      validityDays: 30,
      items: [
        { productId: 'prod-erp-01', variantId: 'var-odoo', quantity: 20, unitPrice: 1560.00 },
        { productId: 'prod-analytics-02', variantId: 'var-std-anl', quantity: 20, unitPrice: 250.00 },
        { productId: 'prod-support-03', variantId: 'var-sla-tier1', quantity: 1, unitPrice: 450.00 }
      ]
    },
    {
      id: 'tpl-starter-growth',
      name: 'Mid-Market Monthly Scaler',
      planId: 'plan-starter-mo',
      validityDays: 15,
      items: [
        { productId: 'prod-erp-01', variantId: 'var-std', quantity: 10, unitPrice: 1000.00 },
        { productId: 'prod-analytics-02', variantId: 'var-std-anl', quantity: 10, unitPrice: 250.00 }
      ]
    }
  ],

  subscriptions: [
    {
      id: 'sub-8842',
      subscriptionNumber: 'SUB-2024-8842',
      customerName: 'Acme Global Enterprise Inc.',
      customerEmail: 'finance@acmeglobal.com',
      crn: 'US-DEL-9844201',
      tier: 'Tier 1 Enterprise',
      planId: 'plan-enterprise-yr',
      planName: 'Enterprise Annual Agreement',
      startDate: '2024-10-15',
      expiryDate: '2025-10-14',
      nextBillingDate: '2025-10-15',
      paymentTerms: 'Net 30',
      autoRenew: true,
      status: 'active', // 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed'
      isPaused: false,
      items: [
        {
          id: 'li-1',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite (Odoo Enterprise Edition)',
          variantId: 'var-odoo',
          variantName: 'Odoo Brand Edition (+$560.00)',
          quantity: 25,
          unitPrice: 1560.00,
          taxRate: 8.25,
          discountAmount: 200.00,
          total: 39000.00
        },
        {
          id: 'li-2',
          productId: 'prod-analytics-02',
          productName: 'Brightloop Analytics & Forecasting Pro',
          variantId: 'var-std-anl',
          variantName: 'Standard Analytics Feed',
          quantity: 25,
          unitPrice: 250.00,
          taxRate: 8.25,
          discountAmount: 0.00,
          total: 6250.00
        },
        {
          id: 'li-3',
          productId: 'prod-support-03',
          productName: '24/7 Dedicated Support SLA',
          variantId: 'var-sla-tier1',
          variantName: 'Tier 1 Critical SLA',
          quantity: 1,
          unitPrice: 450.00,
          taxRate: 8.25,
          discountAmount: 0.00,
          total: 450.00
        }
      ],
      subtotal: 45700.00,
      taxTotal: 3770.25,
      discountTotal: 200.00,
      grandTotal: 49270.25
    },
    {
      id: 'sub-9102',
      subscriptionNumber: 'SUB-2024-9102',
      customerName: 'Apex Retail Inc',
      customerEmail: 'alex.chen@apexretail.com',
      crn: 'US-CA-7781023',
      tier: 'Tier 2 Business',
      planId: 'plan-starter-mo',
      planName: 'Starter Monthly Tier',
      startDate: '2024-10-01',
      expiryDate: '2024-11-01',
      nextBillingDate: '2024-11-14',
      paymentTerms: 'Due on Receipt',
      autoRenew: true,
      status: 'active',
      isPaused: false,
      items: [
        {
          id: 'li-10',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite (Standard Multi-Tenant)',
          variantId: 'var-std',
          variantName: 'Standard Multi-Tenant Cloud',
          quantity: 1,
          unitPrice: 1250.00,
          taxRate: 8.25,
          discountAmount: 0.00,
          total: 1250.00
        },
        {
          id: 'li-11',
          productId: 'prod-support-03',
          productName: '24/7 Dedicated Support SLA',
          variantId: 'var-sla-tier1',
          variantName: 'Tier 1 SLA',
          quantity: 1,
          unitPrice: 200.00,
          taxRate: 8.25,
          discountAmount: 0.00,
          total: 200.00
        }
      ],
      subtotal: 1450.00,
      taxTotal: 119.63,
      discountTotal: 0.00,
      grandTotal: 1569.63
    },
    {
      id: 'sub-7621',
      subscriptionNumber: 'SUB-2024-7621',
      customerName: 'Horizon Global Logistics',
      customerEmail: 'procurement@horizonlogistics.com',
      crn: 'US-IL-3329019',
      tier: 'Enterprise',
      planId: 'plan-enterprise-yr',
      planName: 'Enterprise Annual Agreement',
      startDate: '2024-11-01',
      expiryDate: '2025-10-31',
      nextBillingDate: '2024-11-01',
      paymentTerms: 'Net 45',
      autoRenew: true,
      status: 'quotation',
      isPaused: false,
      items: [
        {
          id: 'li-20',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite',
          variantId: 'var-std',
          variantName: 'Standard Multi-Tenant Cloud',
          quantity: 40,
          unitPrice: 1000.00,
          taxRate: 0.00,
          discountAmount: 200.00,
          total: 40000.00
        }
      ],
      subtotal: 40000.00,
      taxTotal: 0.00,
      discountTotal: 200.00,
      grandTotal: 39800.00
    },
    {
      id: 'sub-6510',
      subscriptionNumber: 'SUB-2024-6510',
      customerName: 'Nova Healthcare Systems',
      customerEmail: 'billing@novahealth.org',
      crn: 'US-MA-5510443',
      tier: 'Healthcare Enterprise',
      planId: 'plan-enterprise-yr',
      planName: 'Enterprise Annual Agreement',
      startDate: '2024-11-15',
      expiryDate: '2025-11-14',
      nextBillingDate: '2024-11-15',
      paymentTerms: 'Net 30',
      autoRenew: true,
      status: 'draft',
      isPaused: false,
      items: [
        {
          id: 'li-30',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite',
          variantId: 'var-gov',
          variantName: 'Federal GovCloud Dedicated Enclave (+$1,200)',
          quantity: 15,
          unitPrice: 2200.00,
          taxRate: 0.00,
          discountAmount: 0.00,
          total: 33000.00
        }
      ],
      subtotal: 33000.00,
      taxTotal: 0.00,
      discountTotal: 0.00,
      grandTotal: 33000.00
    },
    {
      id: 'sub-5401',
      subscriptionNumber: 'SUB-2024-5401',
      customerName: 'Vantage Media Works',
      customerEmail: 'admin@vantagemedia.com',
      crn: 'US-NY-1029344',
      tier: 'Starter',
      planId: 'plan-starter-mo',
      planName: 'Starter Monthly Tier',
      startDate: '2023-09-01',
      expiryDate: '2024-09-30',
      nextBillingDate: '2024-09-30',
      paymentTerms: 'Net 15',
      autoRenew: false,
      status: 'closed',
      isPaused: false,
      items: [
        {
          id: 'li-40',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite',
          variantId: 'var-std',
          variantName: 'Standard',
          quantity: 5,
          unitPrice: 1000.00,
          taxRate: 8.25,
          discountAmount: 0.00,
          total: 5000.00
        }
      ],
      subtotal: 5000.00,
      taxTotal: 412.50,
      discountTotal: 0.00,
      grandTotal: 5412.50
    }
  ],

  invoices: [
    {
      id: 'inv-1029',
      invoiceNumber: 'INV-2024-1029',
      subscriptionId: 'sub-9102',
      customerName: 'Apex Retail Inc',
      customerEmail: 'alex.chen@apexretail.com',
      issueDate: '2024-10-01',
      dueDate: '2024-10-20',
      status: 'overdue', // 'draft' | 'confirmed' | 'paid' | 'overdue' | 'cancelled'
      subtotal: 1450.00,
      taxRate: 8.25,
      taxAmount: 119.63,
      discountAmount: 0.00,
      totalAmount: 1569.63,
      amountPaid: 0.00,
      balanceDue: 1569.63,
      daysOverdue: 11,
      lines: [
        { description: 'Brightloop ERP Suite - Standard Multi-Tenant (Oct 2024)', qty: 1, unitPrice: 1250.00, total: 1250.00 },
        { description: '24/7 Dedicated Support SLA - Tier 1 (Oct 2024)', qty: 1, unitPrice: 200.00, total: 200.00 }
      ]
    },
    {
      id: 'inv-1028',
      invoiceNumber: 'INV-2024-1028',
      subscriptionId: 'sub-8842',
      customerName: 'Acme Global Enterprise Inc.',
      customerEmail: 'finance@acmeglobal.com',
      issueDate: '2024-10-15',
      dueDate: '2024-11-14',
      status: 'paid',
      subtotal: 45700.00,
      taxRate: 8.25,
      taxAmount: 3770.25,
      discountAmount: 200.00,
      totalAmount: 49270.25,
      amountPaid: 49270.25,
      balanceDue: 0.00,
      daysOverdue: 0,
      paidDate: '2024-10-16',
      paymentMethod: 'ACH Direct Debit',
      lines: [
        { description: 'Brightloop ERP Suite (Odoo Enterprise Edition) x 25 seats', qty: 25, unitPrice: 1560.00, total: 39000.00 },
        { description: 'Brightloop Analytics & Forecasting Pro x 25 seats', qty: 25, unitPrice: 250.00, total: 6250.00 },
        { description: '24/7 Enterprise Dedicated Support SLA', qty: 1, unitPrice: 450.00, total: 450.00 }
      ]
    },
    {
      id: 'inv-1027',
      invoiceNumber: 'INV-2024-1027',
      subscriptionId: 'sub-cust-003',
      customerName: 'Zenith Financial Advisors',
      customerEmail: 'ap@zenithfin.com',
      issueDate: '2024-09-25',
      dueDate: '2024-10-12',
      status: 'overdue',
      subtotal: 12500.00,
      taxRate: 8.25,
      taxAmount: 1031.25,
      discountAmount: 0.00,
      totalAmount: 13531.25,
      amountPaid: 0.00,
      balanceDue: 13531.25,
      daysOverdue: 19,
      lines: [
        { description: 'Enterprise Annual Cloud Platform License', qty: 10, unitPrice: 1250.00, total: 12500.00 }
      ]
    },
    {
      id: 'inv-1026',
      invoiceNumber: 'INV-2024-1026',
      subscriptionId: 'sub-cust-004',
      customerName: 'Global Pulse Systems',
      customerEmail: 'billing@globalpulse.net',
      issueDate: '2024-10-10',
      dueDate: '2024-11-09',
      status: 'confirmed',
      subtotal: 8400.00,
      taxRate: 0.00,
      taxAmount: 0.00,
      discountAmount: 400.00,
      totalAmount: 8000.00,
      amountPaid: 0.00,
      balanceDue: 8000.00,
      daysOverdue: 0,
      lines: [
        { description: 'Quarterly Platform Subscription', qty: 8, unitPrice: 1050.00, total: 8400.00 }
      ]
    },
    {
      id: 'inv-1025',
      invoiceNumber: 'INV-2024-1025',
      subscriptionId: 'sub-cust-005',
      customerName: 'Hyperion Cloud Technologies',
      customerEmail: 'invoices@hyperioncloud.io',
      issueDate: '2024-10-28',
      dueDate: '2024-11-27',
      status: 'draft',
      subtotal: 4800.00,
      taxRate: 8.25,
      taxAmount: 396.00,
      discountAmount: 0.00,
      totalAmount: 5196.00,
      amountPaid: 0.00,
      balanceDue: 5196.00,
      daysOverdue: 0,
      lines: [
        { description: 'Monthly Cloud Infrastructure Add-on', qty: 4, unitPrice: 1200.00, total: 4800.00 }
      ]
    }
  ],

  payments: [
    {
      id: 'pay-501',
      invoiceNumber: 'INV-2024-1028',
      customerName: 'Acme Global Enterprise Inc.',
      amount: 49270.25,
      method: 'ACH Direct Debit',
      date: '2024-10-16',
      note: 'Wire settlement ref #ACH-DEL-99410'
    },
    {
      id: 'pay-500',
      invoiceNumber: 'INV-2024-1020',
      customerName: 'Kinetic Robotics',
      amount: 18200.00,
      method: 'Stripe Credit Card',
      date: '2024-10-14',
      note: 'Card auth ch_3NqV1298401'
    },
    {
      id: 'pay-499',
      invoiceNumber: 'INV-2024-1018',
      customerName: 'Solaria Energy Systems',
      amount: 9400.00,
      method: 'Bank Wire',
      date: '2024-10-12',
      note: 'SWIFT wire trans ref #WT-2024-8871'
    }
  ],

  billingRuns: [
    {
      id: 'BR-2024-10-01',
      date: '2024-10-01 00:01 AM UTC',
      status: 'Completed',
      subscriptionsProcessed: 412,
      invoicesGenerated: 412,
      duplicatesPrevented: 0,
      skippedCycles: 0,
      executionTimeMs: 184,
      totalBilled: 682410.00
    }
  ],

  notifications: [
    { id: 1, type: 'warning', text: 'Invoice INV-2024-1029 ($1,569.63) is 11 days past due for Apex Retail Inc.', time: '10m ago' },
    { id: 2, type: 'success', text: 'ACH settlement of $49,270.25 reconciled for Acme Global Enterprise.', time: '1h ago' },
    { id: 3, type: 'info', text: 'Automated billing run scheduled for 412 active subscriptions on next cycle.', time: '3h ago' }
  ]
};

class Store {
  constructor() {
    this.listeners = [];
    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.state = JSON.parse(saved);
      } else {
        this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.saveState();
      }
    } catch (e) {
      console.warn('Failed to parse stored state, using initial', e);
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist store', e);
    }
    this.notify();
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

  // Subscriptions
  updateSubscriptionStatus(subId, newStatus) {
    const sub = this.state.subscriptions.find(s => s.id === subId);
    if (sub) {
      sub.status = newStatus;
      this.saveState();
    }
  }

  toggleSubscriptionPause(subId) {
    const sub = this.state.subscriptions.find(s => s.id === subId);
    if (sub) {
      sub.isPaused = !sub.isPaused;
      this.saveState();
    }
  }

  addSubscription(newSub) {
    this.state.subscriptions.unshift(newSub);
    this.saveState();
  }

  // Invoices & Billing
  recordPayment({ invoiceNumber, amount, method, note }) {
    const inv = this.state.invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (!inv) return false;

    const payAmount = parseFloat(amount) || inv.balanceDue;
    inv.amountPaid += payAmount;
    inv.balanceDue = Math.max(0, inv.totalAmount - inv.amountPaid);
    
    if (inv.balanceDue <= 0.01) {
      inv.status = 'paid';
      inv.paidDate = new Date().toISOString().split('T')[0];
      inv.paymentMethod = method;
      inv.daysOverdue = 0;
    }

    // Add payment entry
    this.state.payments.unshift({
      id: 'pay-' + Date.now(),
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      amount: payAmount,
      method,
      date: new Date().toISOString().split('T')[0],
      note: note || 'Settlement recorded'
    });

    this.saveState();
    return true;
  }

  confirmInvoice(invoiceNumber) {
    const inv = this.state.invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (inv && inv.status === 'draft') {
      inv.status = 'confirmed';
      this.saveState();
    }
  }

  cancelInvoice(invoiceNumber) {
    const inv = this.state.invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (inv) {
      inv.status = 'cancelled';
      this.saveState();
    }
  }

  runBatchBilling() {
    const activeSubs = this.state.subscriptions.filter(s => s.status === 'active' && !s.isPaused);
    let createdCount = 0;
    const now = new Date();
    const cycleToken = `RUN-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let totalRunAmount = 0;

    activeSubs.forEach((sub, idx) => {
      // Idempotency check: see if invoice already generated for this cycle
      const alreadyBilled = this.state.invoices.some(
        inv => inv.subscriptionId === sub.id && inv.cycleToken === cycleToken
      );

      if (!alreadyBilled) {
        const nextInvNum = `INV-2024-${1030 + this.state.invoices.length}`;
        const issueDate = now.toISOString().split('T')[0];
        const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

        const newInv = {
          id: 'inv-' + Date.now() + '-' + idx,
          invoiceNumber: nextInvNum,
          subscriptionId: sub.id,
          cycleToken,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          issueDate,
          dueDate,
          status: 'confirmed',
          subtotal: sub.subtotal,
          taxRate: sub.items[0]?.taxRate || 8.25,
          taxAmount: sub.taxTotal,
          discountAmount: sub.discountTotal,
          totalAmount: sub.grandTotal,
          amountPaid: 0.00,
          balanceDue: sub.grandTotal,
          daysOverdue: 0,
          lines: sub.items.map(item => ({
            description: `${item.productName} (${item.variantName || 'Standard'})`,
            qty: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }))
        };

        this.state.invoices.unshift(newInv);
        totalRunAmount += sub.grandTotal;
        createdCount++;
      }
    });

    const runRecord = {
      id: `BR-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Completed',
      subscriptionsProcessed: activeSubs.length,
      invoicesGenerated: createdCount,
      duplicatesPrevented: activeSubs.length - createdCount,
      skippedCycles: 0,
      executionTimeMs: Math.floor(Math.random() * 120) + 110,
      totalBilled: totalRunAmount
    };

    this.state.billingRuns.unshift(runRecord);
    this.saveState();
    return runRecord;
  }

  // Catalog
  addProductVariant(productId, variant) {
    const product = this.state.products.find(p => p.id === productId);
    if (product) {
      if (!product.variants) product.variants = [];
      product.variants.push(variant);
      this.saveState();
    }
  }

  addPlan(plan) {
    this.state.plans.push(plan);
    this.saveState();
  }

  addDiscountRule(rule) {
    this.state.discountRules.push(rule);
    this.saveState();
  }

  resetToInitial() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveState();
  }
}

export const store = new Store();
