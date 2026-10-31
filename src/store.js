// src/store.js - Central Store for Brightloop Subscription Management System
// Uses Indian Rupees (₹) and realistic business workflows

const STORAGE_KEY = 'brightloop_billing_store_v2';

const INITIAL_DATA = {
  currentRole: 'admin', // 'admin' | 'staff' | 'customer'
  activeRoute: 'revenue-operations',
  
  currentUser: {
    admin: {
      name: 'Elena Rostova',
      title: 'Admin (Finance Lead)',
      email: 'elena@brightloop.in',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
    },
    staff: {
      name: 'Rohan Mehta',
      title: 'Sales & Billing Operations',
      email: 'rohan@brightloop.in',
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
    { id: 'st-1', name: 'Rohan Mehta', email: 'rohan@brightloop.in', role: 'Sales & Billing Specialist', joined: '15 Jan 2024', status: 'Active' },
    { id: 'st-2', name: 'Priya Sharma', email: 'priya@brightloop.in', role: 'Customer Success Lead', joined: '01 Mar 2024', status: 'Active' },
    { id: 'st-3', name: 'Vikram Joshi', email: 'vikram@brightloop.in', role: 'Billing Operations Associate', joined: '10 Jun 2024', status: 'Active' }
  ],

  products: [
    {
      id: 'prod-erp-01',
      sku: 'BL-ERP-COR-01',
      name: 'Brightloop ERP Suite',
      type: 'Software',
      category: 'Core Software',
      salesPrice: 1000.00,
      costPrice: 120.00,
      notes: 'Main cloud ERP platform for accounting, sales pipeline, and inventory tracking.',
      variants: [
        { id: 'var-std', name: 'Standard Edition', priceModifier: 0.00 },
        { id: 'var-odoo', name: 'Odoo Enterprise Brand Edition', priceModifier: 560.00 }, // Spec requirement: adds 560 to price
        { id: 'var-gov', name: 'High-Security Dedicated Cloud', priceModifier: 1200.00 }
      ]
    },
    {
      id: 'prod-analytics-02',
      sku: 'BL-ANL-PRO-02',
      name: 'Analytics & Revenue Forecasting',
      type: 'Add-on',
      category: 'Add-on',
      salesPrice: 250.00,
      costPrice: 30.00,
      notes: 'Real-time cohort retention curves, cash flow forecasting, and sales dashboards.',
      variants: [
        { id: 'var-std-anl', name: 'Standard Analytics Feed', priceModifier: 0.00 },
        { id: 'var-ai-anl', name: 'AI Revenue Copilot', priceModifier: 150.00 }
      ]
    },
    {
      id: 'prod-support-03',
      sku: 'BL-SUP-247-03',
      name: '24/7 Dedicated Support SLA',
      type: 'Service',
      category: 'Support',
      salesPrice: 450.00,
      costPrice: 100.00,
      notes: 'Priority ticket handling, 15-minute response SLA, and dedicated account manager.',
      variants: [
        { id: 'var-sla-tier1', name: 'Tier-1 SLA Support', priceModifier: 0.00 },
        { id: 'var-sla-vip', name: 'VIP Priority Phone & Slack SLA', priceModifier: 300.00 }
      ]
    }
  ],

  plans: [
    {
      id: 'plan-starter-mo',
      name: 'Monthly Business Plan',
      recurrence: 'monthly',
      price: 250.00,
      minQuantity: 1,
      availableFrom: '2024-01-01',
      availableTo: '2025-12-31',
      autoClose: false,
      allowPause: true,
      allowRenew: true,
      description: 'Ideal for small shops and fast-growing teams billed every month.'
    },
    {
      id: 'plan-enterprise-yr',
      name: 'Yearly Enterprise Contract',
      recurrence: 'yearly',
      price: 1200.00,
      minQuantity: 5,
      availableFrom: '2024-01-01',
      availableTo: '2026-12-31',
      autoClose: false,
      allowPause: true,
      allowRenew: true,
      description: 'Annual agreement with volume pricing, dedicated TAM, and contract renewal terms.'
    },
    {
      id: 'plan-growth-wk',
      name: 'Weekly Growth Sprint',
      recurrence: 'weekly',
      price: 85.00,
      minQuantity: 1,
      availableFrom: '2024-06-01',
      availableTo: '2025-06-01',
      autoClose: true,
      allowPause: false,
      allowRenew: true,
      description: 'Short-term burst plan for seasonal events or temporary projects.'
    },
    {
      id: 'plan-sandbox-day',
      name: 'Daily Sandbox Testing',
      recurrence: 'daily',
      price: 15.00,
      minQuantity: 1,
      availableFrom: '2024-01-01',
      availableTo: '2025-12-31',
      autoClose: true,
      allowPause: true,
      allowRenew: false,
      description: 'Dedicated staging and test environment billed by the active day.'
    }
  ],

  discountRules: [
    {
      id: 'disc-tier1',
      code: 'VOLUME500',
      name: 'Volume Team Discount',
      type: 'fixed',
      value: 500.00,
      minSubtotal: 2000.00,
      minQuantity: 5,
      validFrom: '2024-01-01',
      validTo: '2025-12-31',
      maxUses: 100,
      currentUses: 34,
      scope: 'whole_subscription',
      status: 'active'
    },
    {
      id: 'disc-earlybird',
      code: 'FESTIVE15',
      name: 'Annual Commitment 15% Off',
      type: 'percentage',
      value: 15.0,
      minSubtotal: 1000.00,
      minQuantity: 1,
      validFrom: '2024-01-01',
      validTo: '2025-12-31',
      maxUses: 50,
      currentUses: 19,
      scope: 'whole_subscription',
      status: 'active'
    },
    {
      id: 'disc-summer',
      code: 'STARTUP20',
      name: 'Early Adopter 20% Off',
      type: 'percentage',
      value: 20.0,
      minSubtotal: 3000.00,
      minQuantity: 10,
      validFrom: '2024-01-01',
      validTo: '2024-06-30',
      maxUses: 20,
      currentUses: 20,
      scope: 'whole_subscription',
      status: 'expired'
    }
  ],

  taxRules: [
    { id: 'tax-gst-18', name: 'GST Software & Cloud Services (18%)', rate: 18.0, jurisdiction: 'IN-GST', active: true },
    { id: 'tax-gst-exempt', name: 'SEZ / Export of Services (0%)', rate: 0.0, jurisdiction: 'IN-EXEMPT', active: true },
    { id: 'tax-tds-comp', name: 'Inter-State IGST (18%)', rate: 18.0, jurisdiction: 'IN-IGST', active: true }
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
      name: 'Mid-Market Business Monthly Plan',
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
      customerName: 'Zenith Technologies Pvt Ltd',
      customerEmail: 'billing@zenithtech.in',
      crn: 'CIN: U72200MH2021PTC384420',
      tier: 'Enterprise Annual Tier',
      planId: 'plan-enterprise-yr',
      planName: 'Yearly Enterprise Contract',
      startDate: '2024-10-15',
      expiryDate: '2025-10-14',
      nextBillingDate: '2025-10-15',
      paymentTerms: 'Net 30 Days',
      autoRenew: true,
      status: 'active',
      isPaused: false,
      items: [
        {
          id: 'li-1',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite',
          variantId: 'var-odoo',
          variantName: 'Odoo Enterprise Brand Edition (+₹560)',
          quantity: 25,
          unitPrice: 1560.00,
          taxRate: 18.0,
          discountAmount: 500.00,
          total: 39000.00
        },
        {
          id: 'li-2',
          productId: 'prod-analytics-02',
          productName: 'Analytics & Revenue Forecasting',
          variantId: 'var-std-anl',
          variantName: 'Standard Analytics Feed',
          quantity: 25,
          unitPrice: 250.00,
          taxRate: 18.0,
          discountAmount: 0.00,
          total: 6250.00
        },
        {
          id: 'li-3',
          productId: 'prod-support-03',
          productName: '24/7 Dedicated Support SLA',
          variantId: 'var-sla-tier1',
          variantName: 'Tier-1 SLA Support',
          quantity: 1,
          unitPrice: 450.00,
          taxRate: 18.0,
          discountAmount: 0.00,
          total: 450.00
        }
      ],
      subtotal: 45700.00,
      taxTotal: 8136.00,
      discountTotal: 500.00,
      grandTotal: 53336.00
    },
    {
      id: 'sub-9102',
      subscriptionNumber: 'SUB-2024-9102',
      customerName: 'Apex Retail Pvt Ltd',
      customerEmail: 'aarav@apexretail.in',
      crn: 'CIN: U51909GJ2022PTC118920',
      tier: 'Monthly Business Plan',
      planId: 'plan-starter-mo',
      planName: 'Monthly Business Plan',
      startDate: '2024-10-01',
      expiryDate: '2024-11-01',
      nextBillingDate: '2024-11-14',
      paymentTerms: 'Due on Receipt',
      autoRenew: true,
      status: 'active',
      isPaused: false,
      addonsEnabled: {
        analytics: true,
        support: true
      },
      items: [
        {
          id: 'li-10',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite (Standard Edition)',
          variantId: 'var-std',
          variantName: 'Standard Edition',
          quantity: 1,
          unitPrice: 1000.00,
          taxRate: 18.0,
          discountAmount: 0.00,
          total: 1000.00
        },
        {
          id: 'li-11',
          productId: 'prod-analytics-02',
          productName: 'Analytics & Revenue Forecasting Add-on',
          variantId: 'var-std-anl',
          variantName: 'Standard Analytics Feed',
          quantity: 1,
          unitPrice: 250.00,
          taxRate: 18.0,
          discountAmount: 0.00,
          total: 250.00
        },
        {
          id: 'li-12',
          productId: 'prod-support-03',
          productName: '24/7 Dedicated Support SLA',
          variantId: 'var-sla-tier1',
          variantName: 'Tier-1 SLA Support',
          quantity: 1,
          unitPrice: 200.00,
          taxRate: 18.0,
          discountAmount: 0.00,
          total: 200.00
        }
      ],
      subtotal: 1450.00,
      taxTotal: 261.00,
      discountTotal: 0.00,
      grandTotal: 1711.00
    },
    {
      id: 'sub-7621',
      subscriptionNumber: 'SUB-2024-7621',
      customerName: 'Horizon Logistics Solutions',
      customerEmail: 'billing@horizonlogistics.in',
      crn: 'CIN: U63090KA2020PTC099410',
      tier: 'Enterprise Annual Tier',
      planId: 'plan-enterprise-yr',
      planName: 'Yearly Enterprise Contract',
      startDate: '2024-11-01',
      expiryDate: '2025-10-31',
      nextBillingDate: '2024-11-01',
      paymentTerms: 'Net 45 Days',
      autoRenew: true,
      status: 'quotation',
      isPaused: false,
      items: [
        {
          id: 'li-20',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite',
          variantId: 'var-std',
          variantName: 'Standard Edition',
          quantity: 40,
          unitPrice: 1000.00,
          taxRate: 18.0,
          discountAmount: 500.00,
          total: 40000.00
        }
      ],
      subtotal: 40000.00,
      taxTotal: 7110.00,
      discountTotal: 500.00,
      grandTotal: 46610.00
    },
    {
      id: 'sub-6510',
      subscriptionNumber: 'SUB-2024-6510',
      customerName: 'Nova Healthcare Services',
      customerEmail: 'accounts@novahealth.in',
      crn: 'CIN: U85110DL2019PTC044210',
      tier: 'Healthcare Cloud Agreement',
      planId: 'plan-enterprise-yr',
      planName: 'Yearly Enterprise Contract',
      startDate: '2024-11-15',
      expiryDate: '2025-11-14',
      nextBillingDate: '2024-11-15',
      paymentTerms: 'Net 30 Days',
      autoRenew: true,
      status: 'draft',
      isPaused: false,
      items: [
        {
          id: 'li-30',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite',
          variantId: 'var-gov',
          variantName: 'High-Security Dedicated Cloud (+₹1,200)',
          quantity: 15,
          unitPrice: 2200.00,
          taxRate: 18.0,
          discountAmount: 0.00,
          total: 33000.00
        }
      ],
      subtotal: 33000.00,
      taxTotal: 5940.00,
      discountTotal: 0.00,
      grandTotal: 38940.00
    },
    {
      id: 'sub-5401',
      subscriptionNumber: 'SUB-2024-5401',
      customerName: 'Vantage Media Works',
      customerEmail: 'finance@vantagemedia.in',
      crn: 'CIN: U92100DL2018PTC021990',
      tier: 'Monthly Business Plan',
      planId: 'plan-starter-mo',
      planName: 'Monthly Business Plan',
      startDate: '2023-09-01',
      expiryDate: '2024-09-30',
      nextBillingDate: '2024-09-30',
      paymentTerms: 'Net 15 Days',
      autoRenew: false,
      status: 'closed',
      isPaused: false,
      items: [
        {
          id: 'li-40',
          productId: 'prod-erp-01',
          productName: 'Brightloop ERP Suite',
          variantId: 'var-std',
          variantName: 'Standard Edition',
          quantity: 5,
          unitPrice: 1000.00,
          taxRate: 18.0,
          discountAmount: 0.00,
          total: 5000.00
        }
      ],
      subtotal: 5000.00,
      taxTotal: 900.00,
      discountTotal: 0.00,
      grandTotal: 5900.00
    }
  ],

  invoices: [
    {
      id: 'inv-1029',
      invoiceNumber: 'INV-2024-1029',
      subscriptionId: 'sub-9102',
      customerName: 'Apex Retail Pvt Ltd',
      customerEmail: 'aarav@apexretail.in',
      issueDate: '2024-10-01',
      dueDate: '2024-10-20',
      status: 'overdue',
      subtotal: 1450.00,
      taxRate: 18.0,
      taxAmount: 261.00,
      discountAmount: 0.00,
      totalAmount: 1711.00,
      amountPaid: 0.00,
      balanceDue: 1711.00,
      daysOverdue: 11,
      lines: [
        { description: 'Brightloop ERP Suite - Standard Edition (Oct 2024)', qty: 1, unitPrice: 1000.00, total: 1000.00 },
        { description: 'Analytics & Revenue Forecasting Add-on (Oct 2024)', qty: 1, unitPrice: 250.00, total: 250.00 },
        { description: '24/7 Dedicated Support SLA - Tier 1 (Oct 2024)', qty: 1, unitPrice: 200.00, total: 200.00 }
      ]
    },
    {
      id: 'inv-1028',
      invoiceNumber: 'INV-2024-1028',
      subscriptionId: 'sub-8842',
      customerName: 'Zenith Technologies Pvt Ltd',
      customerEmail: 'billing@zenithtech.in',
      issueDate: '2024-10-15',
      dueDate: '2024-11-14',
      status: 'paid',
      subtotal: 45700.00,
      taxRate: 18.0,
      taxAmount: 8136.00,
      discountAmount: 500.00,
      totalAmount: 53336.00,
      amountPaid: 53336.00,
      balanceDue: 0.00,
      daysOverdue: 0,
      paidDate: '2024-10-16',
      paymentMethod: 'Net Banking (HDFC Corporate)',
      lines: [
        { description: 'Brightloop ERP Suite (Odoo Enterprise Edition) x 25 seats', qty: 25, unitPrice: 1560.00, total: 39000.00 },
        { description: 'Analytics & Revenue Forecasting x 25 seats', qty: 25, unitPrice: 250.00, total: 6250.00 },
        { description: '24/7 Dedicated Support SLA', qty: 1, unitPrice: 450.00, total: 450.00 }
      ]
    },
    {
      id: 'inv-1027',
      invoiceNumber: 'INV-2024-1027',
      subscriptionId: 'sub-cust-003',
      customerName: 'Kaveri Logistics & Supply',
      customerEmail: 'ap@kaverilogistics.in',
      issueDate: '2024-09-25',
      dueDate: '2024-10-12',
      status: 'overdue',
      subtotal: 12500.00,
      taxRate: 18.0,
      taxAmount: 2250.00,
      discountAmount: 0.00,
      totalAmount: 14750.00,
      amountPaid: 0.00,
      balanceDue: 14750.00,
      daysOverdue: 19,
      lines: [
        { description: 'Cloud Platform Annual Subscription (10 seats)', qty: 10, unitPrice: 1250.00, total: 12500.00 }
      ]
    },
    {
      id: 'inv-1026',
      invoiceNumber: 'INV-2024-1026',
      subscriptionId: 'sub-cust-004',
      customerName: 'Global Pulse Systems India',
      customerEmail: 'billing@globalpulse.in',
      issueDate: '2024-10-10',
      dueDate: '2024-11-09',
      status: 'confirmed',
      subtotal: 8400.00,
      taxRate: 18.0,
      taxAmount: 1512.00,
      discountAmount: 400.00,
      totalAmount: 9512.00,
      amountPaid: 0.00,
      balanceDue: 9512.00,
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
      customerEmail: 'invoices@hyperioncloud.in',
      issueDate: '2024-10-28',
      dueDate: '2024-11-27',
      status: 'draft',
      subtotal: 4800.00,
      taxRate: 18.0,
      taxAmount: 864.00,
      discountAmount: 0.00,
      totalAmount: 5664.00,
      amountPaid: 0.00,
      balanceDue: 5664.00,
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
      customerName: 'Zenith Technologies Pvt Ltd',
      amount: 53336.00,
      method: 'Net Banking (HDFC Corporate)',
      date: '2024-10-16',
      note: 'Settlement via NEFT ref #HDFC0001928'
    },
    {
      id: 'pay-500',
      invoiceNumber: 'INV-2024-1020',
      customerName: 'Kinetic Robotics India',
      amount: 18200.00,
      method: 'UPI (Corporate GPay)',
      date: '2024-10-14',
      note: 'UPI txn id: 428910293810@hdfcbank'
    },
    {
      id: 'pay-499',
      invoiceNumber: 'INV-2024-1018',
      customerName: 'Solaria Energy Systems',
      amount: 9400.00,
      method: 'RTGS / Bank Transfer',
      date: '2024-10-12',
      note: 'SBI RTGS ref #SBIN20241012984'
    }
  ],

  billingRuns: [
    {
      id: 'BR-2024-10-01',
      date: '01 Oct 2024 00:01 AM IST',
      status: 'Completed',
      subscriptionsProcessed: 412,
      invoicesGenerated: 412,
      duplicatesPrevented: 0,
      skippedCycles: 0,
      executionTimeMs: 142,
      totalBilled: 682410.00
    }
  ],

  notifications: [
    { id: 1, type: 'warning', text: 'Invoice INV-2024-1029 (₹1,711.00) is 11 days overdue for Apex Retail Pvt Ltd.', time: '10 mins ago' },
    { id: 2, type: 'success', text: 'Payment of ₹53,336.00 received via HDFC Net Banking from Zenith Technologies.', time: '1 hour ago' },
    { id: 3, type: 'info', text: 'Auto-batch billing run successfully processed 412 active subscriptions.', time: '3 hours ago' }
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

  // Staff Management (Admin Only requirement: "Only the admin can add a new member of staff")
  addStaffMember({ name, email, role }) {
    if (this.state.currentRole !== 'admin') {
      throw new Error('Only the admin can add a new member of staff.');
    }
    const newStaff = {
      id: 'st-' + Date.now(),
      name,
      email,
      role: role || 'Sales & Support Associate',
      joined: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active'
    };
    this.state.staffMembers.push(newStaff);
    this.saveState();
    return newStaff;
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

  // Customer Portal: Toggling Add-ons ("add-ons customers switch on and off")
  toggleCustomerAddon(subId, addonType) {
    const sub = this.state.subscriptions.find(s => s.id === subId);
    if (!sub) return;

    if (!sub.addonsEnabled) {
      sub.addonsEnabled = { analytics: true, support: true };
    }

    sub.addonsEnabled[addonType] = !sub.addonsEnabled[addonType];

    // Recalculate subscription line items and total
    const baseProduct = this.state.products[0];
    const items = [
      {
        id: 'li-core',
        productId: baseProduct.id,
        productName: `${baseProduct.name} (Standard Edition)`,
        variantId: 'var-std',
        variantName: 'Standard Edition',
        quantity: 1,
        unitPrice: 1000.00,
        taxRate: 18.0,
        discountAmount: 0.00,
        total: 1000.00
      }
    ];

    if (sub.addonsEnabled.analytics) {
      items.push({
        id: 'li-addon-anl',
        productId: 'prod-analytics-02',
        productName: 'Analytics & Revenue Forecasting Add-on',
        variantId: 'var-std-anl',
        variantName: 'Standard Analytics Feed',
        quantity: 1,
        unitPrice: 250.00,
        taxRate: 18.0,
        discountAmount: 0.00,
        total: 250.00
      });
    }

    if (sub.addonsEnabled.support) {
      items.push({
        id: 'li-addon-sup',
        productId: 'prod-support-03',
        productName: '24/7 Dedicated Support SLA',
        variantId: 'var-sla-tier1',
        variantName: 'Tier-1 SLA Support',
        quantity: 1,
        unitPrice: 200.00,
        taxRate: 18.0,
        discountAmount: 0.00,
        total: 200.00
      });
    }

    sub.items = items;
    sub.subtotal = items.reduce((acc, i) => acc + i.total, 0);
    sub.taxTotal = sub.subtotal * 0.18;
    sub.grandTotal = sub.subtotal + sub.taxTotal;

    this.saveState();
    return sub;
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

    this.state.payments.unshift({
      id: 'pay-' + Date.now(),
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      amount: payAmount,
      method,
      date: new Date().toISOString().split('T')[0],
      note: note || 'Settled via ' + method
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
      inv.balanceDue = 0.00;
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
          taxRate: 18.0,
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
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Completed',
      subscriptionsProcessed: activeSubs.length,
      invoicesGenerated: createdCount,
      duplicatesPrevented: activeSubs.length - createdCount,
      skippedCycles: 0,
      executionTimeMs: Math.floor(Math.random() * 80) + 110,
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
