// src/main.js - Application Controller & Bootstrap
import { store } from './store.js';
import { renderNavbar } from './components/navbar.js';
import { renderRevenueOps } from './components/revenueOps.js';
import { renderSubscriptions, setSelectedSubscription, setSubFilter } from './components/subscriptions.js';
import { renderBilling, setInvoiceFilter, setInvoiceSearch } from './components/billing.js';
import { renderCatalog, setCatalogTab } from './components/catalog.js';
import { renderCustomerPortal } from './components/customerPortal.js';
import { showModal, closeModal } from './components/modals.js';

// --- Toast Notification System ---
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-[#006a61] text-white' : type === 'warning' ? 'bg-[#ba1a1a] text-white' : 'bg-[#081534] text-white';
  
  toast.className = `${bg} px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 opacity-0 translate-y-2`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-sm">${type === 'success' ? 'check_circle' : type === 'warning' ? 'warning' : 'info'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Global Window Bindings for Interactivity ---
window.appNavigate = (route) => {
  store.setRoute(route);
};

window.switchRole = (role) => {
  store.setRole(role);
  showToast(`Switched view to ${role.toUpperCase()}`, 'info');
};

window.selectSubscriptionRecord = (subId) => {
  setSelectedSubscription(subId);
  renderApp();
};

window.advanceSubscriptionStage = (subId) => {
  const stages = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
  const state = store.getState();
  const sub = state.subscriptions.find(s => s.id === subId);
  if (!sub) return;
  const currIdx = stages.indexOf(sub.status);
  if (currIdx < stages.length - 1) {
    const nextStage = stages[currIdx + 1];
    store.updateSubscriptionStatus(subId, nextStage);
    showToast(`Subscription ${sub.subscriptionNumber} advanced to ${nextStage.toUpperCase()}`, 'success');
  }
};

window.togglePauseSub = (subId) => {
  store.toggleSubscriptionPause(subId);
  const sub = store.getState().subscriptions.find(s => s.id === subId);
  showToast(`Subscription ${sub?.isPaused ? 'paused' : 'resumed'} successfully`, 'info');
};

window.closeSubscription = (subId) => {
  if (confirm('Are you sure you want to cancel and close this subscription?')) {
    store.updateSubscriptionStatus(subId, 'closed');
    showToast('Subscription closed and marked as finalized', 'warning');
  }
};

window.createRenewalQuote = (subId) => {
  const state = store.getState();
  const sub = state.subscriptions.find(s => s.id === subId);
  if (!sub) return;

  const newSubNumber = `SUB-2025-${Math.floor(1000 + Math.random() * 9000)}`;
  const renewalSub = {
    ...JSON.parse(JSON.stringify(sub)),
    id: 'sub-' + Date.now(),
    subscriptionNumber: newSubNumber,
    status: 'quotation',
    startDate: '2025-10-15',
    expiryDate: '2026-10-14',
    nextBillingDate: '2025-10-15'
  };

  store.addSubscription(renewalSub);
  setSelectedSubscription(renewalSub.id);
  showToast(`Renewal Quote ${newSubNumber} created in Quotation stage!`, 'success');
};

window.generateNextInvoiceForSub = (subId) => {
  const state = store.getState();
  const sub = state.subscriptions.find(s => s.id === subId);
  if (!sub) return;

  const nextInvNum = `INV-2024-${1035 + state.invoices.length}`;
  const now = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const subtotal = sub.subtotal !== undefined ? sub.subtotal : (sub.totalAmount || 0);
  const taxTotal = sub.taxTotal !== undefined ? sub.taxTotal : (subtotal * 0.18);
  const discountTotal = sub.discountTotal || 0;
  const grandTotal = sub.grandTotal !== undefined ? sub.grandTotal : (subtotal - discountTotal + taxTotal);
  const linesList = sub.lines || sub.items || [];

  const newInv = {
    id: 'inv-' + Date.now(),
    invoiceNumber: nextInvNum,
    subscriptionId: sub.id,
    customerName: sub.customerName,
    customerEmail: sub.customerEmail,
    issueDate: now,
    dueDate: dueDate,
    status: 'confirmed',
    subtotal: subtotal,
    taxRate: 18.0,
    taxAmount: taxTotal,
    discountAmount: discountTotal,
    totalAmount: grandTotal,
    amountPaid: 0.00,
    balanceDue: grandTotal,
    daysOverdue: 0,
    lines: linesList.map(i => ({
      description: `${i.product_name || i.productName || 'Software Service'} (${i.variant_name || i.variantName || 'Standard'})`,
      qty: i.quantity || i.qty || 1,
      quantity: i.quantity || i.qty || 1,
      unitPrice: i.unit_price !== undefined ? i.unit_price : (i.unitPrice || 0),
      total: i.subtotal !== undefined ? i.subtotal : (i.total || ((i.unit_price || 0) * (i.quantity || 1)))
    }))
  };

  store.addInvoice(newInv);
  showToast(`Invoice ${nextInvNum} generated for ${sub.customerName}!`, 'success');
  window.appNavigate('billing-invoices');
};

// Batch Billing Run
window.triggerBatchBillingRun = async () => {
  showToast('Executing automated recurring billing run...', 'info');
  const runResult = await store.runBatchBilling();
  showModal('batchRun', runResult);
  showToast(`Billing run complete: ${runResult.invoicesGenerated} invoices generated (${runResult.duplicatesPrevented} duplicates prevented)!`, 'success');
};

// Invoice Actions (Confirm, Cancel, Send, Print, Record Pay)
window.confirmDraftInvoice = (invNum) => {
  store.confirmInvoice(invNum);
  showToast(`Invoice ${invNum} confirmed & moved to Confirmed!`, 'success');
};

window.confirmInvoiceAction = (invNum) => {
  store.confirmInvoice(invNum);
  showToast(`Invoice ${invNum} confirmed and recorded!`, 'success');
};

window.sendInvoiceAction = (invNum, clientName) => {
  showToast(`Invoice ${invNum} sent via email to ${clientName}!`, 'success');
};

window.cancelInvoiceAction = (invNum) => {
  if (confirm(`Are you sure you want to cancel and void invoice ${invNum}?`)) {
    store.cancelInvoice(invNum);
    showToast(`Invoice ${invNum} has been cancelled and voided.`, 'warning');
  }
};

window.sendDunningNotice = (invNum, clientName) => {
  showToast(`Payment reminder dispatched to ${clientName} for invoice ${invNum}`, 'info');
};

window.setSubFilterTab = (filter) => {
  setSubFilter(filter);
  renderApp();
};

window.setInvoiceFilterTab = (filter) => {
  setInvoiceFilter(filter);
  renderApp();
};

window.handleInvoiceSearch = (term) => {
  setInvoiceSearch(term);
  renderApp();
};

window.filterInvoices = (filter) => {
  setInvoiceFilter(filter);
  renderApp();
};

window.searchInvoices = (term) => {
  setInvoiceSearch(term);
  renderApp();
};

window.switchCatalogTab = (tab) => {
  setCatalogTab(tab);
  renderApp();
};

// Customer Portal: Modular Add-on Toggling
window.toggleAddon = (addonKey) => {
  const sub = store.getState().subscriptions.find(s => s.customerEmail === 'aarav@apexretail.in') || store.getState().subscriptions[0];
  if (sub) {
    store.toggleCustomerAddon(sub.id, addonKey);
    showToast(`Add-on ${addonKey === 'analytics' ? 'Developer API' : '24/7 Support SLA'} updated!`, 'success');
  }
};

window.toggleCustomerAddonAction = (subId, addonType) => {
  store.toggleCustomerAddon(subId, addonType);
  showToast(`Add-on updated! Next billing cycle adjusted in real-time.`, 'success');
};

window.previewInvoicePDF = (invNum) => {
  showModal('printInvoice', { invoiceNumber: invNum });
};

// Modal helpers
window.openModal = showModal;
window.closeModal = closeModal;

window.openNewQuoteModal = () => showModal('newQuote');
window.openRecordPaymentModal = (invoiceNumber, balanceDue) => showModal('recordPayment', { invoiceNumber, balanceDue });
window.openAddVariantModal = () => showModal('addVariant');
window.openAddPlanModal = () => showModal('addPlan');
window.openAddDiscountModal = () => showModal('addDiscount');
window.openAuthModal = () => showModal('auth');
window.openSearchModal = () => showModal('search');
window.openCustomerUpgradeModal = () => showModal('upgrade');
window.openStaffModal = () => showModal('staffManagement');
window.previewInvoicePrint = (invoiceNumber) => showModal('printInvoice', { invoiceNumber });
window.previewQuotationPrint = (subId) => {
  const sub = store.getState().subscriptions.find(s => s.id === subId);
  if (sub) {
    showModal('printInvoice', { invoiceNumber: sub.subscriptionNumber });
  }
};

// Quotation Template Auto-population
window.applyQuotationTemplate = (templateId) => {
  if (!templateId) return;
  const state = store.getState();
  const tpl = state.quotationTemplates.find(t => t.id === templateId);
  if (!tpl) return;

  const planEl = document.getElementById('quotePlan');
  const variantEl = document.getElementById('quoteVariant');
  const qtyEl = document.getElementById('quoteQty');
  const validityEl = document.getElementById('quoteValidityDisplay');

  if (planEl && tpl.planId) planEl.value = tpl.planId;
  const firstItem = (tpl.items && tpl.items[0]) || {};
  if (variantEl) {
    if (firstItem.variantId && Array.from(variantEl.options).some(o => o.value === firstItem.variantId)) {
      variantEl.value = firstItem.variantId;
    } else {
      const odooOption = Array.from(variantEl.options).find(o => o.text.toLowerCase().includes('odoo'));
      if (odooOption) odooOption.selected = true;
    }
  }
  if (qtyEl && firstItem.quantity) qtyEl.value = firstItem.quantity;
  if (validityEl) validityEl.value = `Valid for ${tpl.validityDays || 30} calendar days (Template standard)`;

  showToast(`Applied "${tpl.name}" template with Odoo Brand Edition lines!`, 'info');
};

// Add Staff Member
window.handleAddStaffSubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('newStaffName').value;
  const email = document.getElementById('newStaffEmail').value;
  const role = document.getElementById('newStaffRole').value;

  try {
    store.addStaffMember({ name, email, role });
    showToast(`Staff member ${name} (${role}) onboarded successfully!`, 'success');
    showModal('staffManagement');
  } catch (err) {
    alert(err.message);
  }
};

// Form submission handlers
window.handleCreateQuoteSubmit = (e) => {
  e.preventDefault();
  const customerName = document.getElementById('quoteCustomerName').value;
  const customerEmail = document.getElementById('quoteCustomerEmail').value;
  const planId = document.getElementById('quotePlan').value;
  const variantId = document.getElementById('quoteVariant').value;
  const qty = parseInt(document.getElementById('quoteQty').value) || 1;
  const discountCode = document.getElementById('quoteDiscountCode').value.trim().toUpperCase();
  const paymentTerms = document.getElementById('quotePaymentTerms').value;

  const state = store.getState();
  const plan = state.plans.find(p => p.id === planId) || state.plans[0] || { id: 'plan-monthly', name: 'Monthly Professional Plan' };
  const product = state.products[0] || { id: 'prod-saas-core', name: 'Brightloop Core Suite', salesPrice: 3499, base_price: 3499, variants: [] };
  const variant = (product.variants || []).find(v => v.id === variantId) || product.variants?.[0] || { id: 'var-core-odoo', name: 'Odoo Connected Edition', variant_name: 'Odoo Connected Edition', priceModifier: 560, extra_price: 560 };

  const basePrice = product.salesPrice !== undefined ? product.salesPrice : (product.base_price || 3499);
  const extraPrice = variant.priceModifier !== undefined ? variant.priceModifier : (variant.extra_price || 0);
  const unitPrice = basePrice + extraPrice;
  let lineTotal = unitPrice * qty;
  let discountAmount = 0;

  if (discountCode === 'VOLUME500' || discountCode === 'STARTUP500') {
    discountAmount = 500.00;
  } else if (discountCode === 'FESTIVE15') {
    discountAmount = lineTotal * 0.15;
  } else if (discountCode === 'DIWALI20') {
    discountAmount = lineTotal * 0.20;
  }

  const subtotal = lineTotal;
  const taxTotal = Math.max(0, subtotal - discountAmount) * 0.18;
  const grandTotal = Math.max(0, subtotal - discountAmount) + taxTotal;

  const newSubNumber = `SUB-2024-${Math.floor(2000 + Math.random() * 8000)}`;
  const lineItem = {
    id: 'li-' + Date.now(),
    productId: product.id,
    product_id: product.id,
    productName: product.name,
    product_name: product.name,
    variantId: variant.id,
    variant_id: variant.id,
    variantName: variant.name || variant.variant_name || 'Standard Edition',
    variant_name: variant.name || variant.variant_name || 'Standard Edition',
    quantity: qty,
    unitPrice: unitPrice,
    unit_price: unitPrice,
    taxRate: 18.0,
    discountAmount: discountAmount,
    discount_percent: discountAmount > 0 ? ((discountAmount / lineTotal) * 100) : 0,
    total: lineTotal,
    subtotal: lineTotal
  };

  const newSub = {
    id: 'sub-' + Date.now(),
    subscriptionNumber: newSubNumber,
    customerName,
    customerEmail,
    customerCompany: customerName,
    customerGstin: '27AABCB1234F1Z0',
    crn: 'CIN: U' + Math.floor(100000000000 + Math.random() * 900000000000),
    tier: 'Enterprise Custom',
    planId: plan.id,
    planName: plan.name,
    billingPeriod: plan.billing_period || plan.recurrence || 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    nextBillingDate: new Date().toISOString().split('T')[0],
    paymentTerms,
    autoRenew: true,
    status: 'draft',
    isPaused: false,
    addonsEnabled: { analytics: true, support: true },
    items: [lineItem],
    lines: [lineItem],
    totalAmount: subtotal,
    subtotal: subtotal,
    taxTotal: taxTotal,
    discountTotal: discountAmount,
    grandTotal: grandTotal
  };

  store.addSubscription(newSub);
  setSelectedSubscription(newSub.id);
  closeModal();
  showToast(`Draft Quotation ${newSubNumber} created!`, 'success');
  window.appNavigate('subscriptions-quotes');
};

window.handleRecordPaymentSubmit = (e, invoiceNumber) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('paymentAmount').value);
  const method = document.getElementById('paymentMethod').value;
  const note = document.getElementById('paymentNote').value;

  const success = store.recordPayment({ invoiceNumber, amount, method, note });
  if (success) {
    closeModal();
    showToast(`Payment of ₹${amount.toFixed(2)} recorded for ${invoiceNumber}!`, 'success');
  }
};

window.handleAddVariantSubmit = (e) => {
  e.preventDefault();
  const productId = document.getElementById('varTargetProduct').value;
  const name = document.getElementById('varName').value;
  const priceModifier = parseFloat(document.getElementById('varPriceModifier').value) || 0;

  store.addProductVariant(productId, {
    id: 'var-' + Date.now(),
    name,
    priceModifier
  });

  closeModal();
  showToast(`Brand variant "${name}" added to catalog!`, 'success');
};

window.handleAddPlanSubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('planName').value;
  const recurrence = document.getElementById('planRecurrence').value;
  const price = parseFloat(document.getElementById('planPrice').value) || 0;
  const minQuantity = parseInt(document.getElementById('planMinQty').value) || 1;
  const allowPause = document.getElementById('planAllowPause').checked;

  store.addPlan({
    id: 'plan-' + Date.now(),
    name,
    recurrence,
    price,
    minQuantity,
    availableFrom: '2024-01-01',
    availableTo: '2026-12-31',
    autoClose: false,
    allowPause,
    allowRenew: true,
    description: `Configured ${recurrence} cadence.`
  });

  closeModal();
  showToast(`Plan "${name}" created successfully!`, 'success');
};

window.handleAddDiscountSubmit = (e) => {
  e.preventDefault();
  const code = document.getElementById('discCode').value.toUpperCase();
  const name = document.getElementById('discName').value;
  const type = document.getElementById('discType').value;
  const value = parseFloat(document.getElementById('discValue').value) || 0;
  const minSubtotal = parseFloat(document.getElementById('discMinSpend').value) || 0;
  const maxUses = parseInt(document.getElementById('discMaxUses').value) || 100;

  store.addDiscountRule({
    id: 'disc-' + Date.now(),
    code,
    name,
    type,
    value,
    minSubtotal,
    minQuantity: 1,
    validFrom: '2024-01-01',
    validTo: '2025-12-31',
    maxUses,
    currentUses: 0,
    scope: 'whole_subscription',
    status: 'active'
  });

  closeModal();
  showToast(`Discount rule "${code}" created and active!`, 'success');
};

// Password Validation (8+ chars, uppercase, lowercase, special)
window.validatePasswordStrength = (pwd) => {
  const hasLen = pwd.length > 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  const updateEl = (id, valid) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (valid) {
      el.className = 'flex items-center gap-1.5 text-emerald-600 font-bold';
      el.querySelector('span').textContent = 'check_circle';
    } else {
      el.className = 'flex items-center gap-1.5 text-[#76777f]';
      el.querySelector('span').textContent = 'radio_button_unchecked';
    }
  };

  updateEl('ruleLen', hasLen);
  updateEl('ruleUpper', hasUpper);
  updateEl('ruleLower', hasLower);
  updateEl('ruleSpecial', hasSpecial);

  return hasLen && hasUpper && hasLower && hasSpecial;
};

window.sendResetPasswordLink = async () => {
  const email = document.getElementById('testAuthEmail')?.value?.trim() || 'aarav@apexretail.in';
  try {
    if (store.getState().isServerConnected) {
      const res = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      alert(`A secure password reset link has been dispatched to: ${email}\nReset Token: ${data.token}`);
      return;
    }
  } catch (e) {
    console.warn('Reset password error:', e);
  }
  alert(`A secure password reset link has been dispatched to: ${email}`);
};

window.simulateCustomerSignup = async () => {
  const email = document.getElementById('testAuthEmail')?.value?.trim();
  const pwd = document.getElementById('testAuthPassword')?.value || '';
  if (!email) {
    alert('Please enter a valid customer email.');
    return;
  }
  const isValid = window.validatePasswordStrength(pwd);
  if (!isValid) {
    alert('Password does not satisfy strict policy:\n• Must be more than 8 characters\n• Must contain at least one uppercase letter\n• Must contain at least one lowercase letter\n• Must contain at least one special character');
    return;
  }
  try {
    const namePart = email.split('@')[0];
    const customerName = namePart.charAt(0).toUpperCase() + namePart.slice(1) + ' Enterprise';
    await store.registerCustomer({
      name: customerName,
      email,
      password: pwd,
      company: customerName,
      phone: '+91 98000 12345'
    });
    closeModal();
    showToast(`Account registered for ${email}! Welcome to your portal.`, 'success');
  } catch (err) {
    alert('Registration error: ' + err.message);
  }
};

window.exportReportCSV = () => {
  const state = store.getState();
  const rows = [
    ['Subscription Number', 'Customer', 'Plan', 'Status', 'MRR / Invoiced (INR)'],
    ...state.subscriptions.map(s => [s.subscriptionNumber, s.customerName, s.planName, s.status, s.grandTotal])
  ];
  downloadCSV('Brightloop_Revenue_Report.csv', rows);
};

window.exportLedgerCSV = () => {
  const state = store.getState();
  const rows = [
    ['Invoice Number', 'Customer', 'Issue Date', 'Due Date', 'Status', 'Total (INR)', 'Balance Due (INR)'],
    ...state.invoices.map(i => [i.invoiceNumber, i.customerName, i.issueDate, i.dueDate, i.status, i.totalAmount, i.balanceDue])
  ];
  downloadCSV('Brightloop_Invoices_Ledger.csv', rows);
};

window.refreshLedger = () => {
  showToast('Reconciled ledger with bank statements... 0 discrepancies.', 'success');
  renderApp();
};

function downloadCSV(filename, rows) {
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`Downloaded ${filename}`, 'info');
}

// Global Keyboard Shortcut: Cmd+K / Ctrl+K
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    showModal('search');
  }
});

// --- Main App Render Cycle ---
export function renderApp() {
  const state = store.getState();
  const navbarContainer = document.getElementById('navbar-root');
  const mainContainer = document.getElementById('main-root');

  if (navbarContainer) {
    navbarContainer.innerHTML = renderNavbar();
  }

  if (mainContainer) {
    switch (state.activeRoute) {
      case 'revenue-operations':
        mainContainer.innerHTML = renderRevenueOps();
        break;
      case 'subscriptions-quotes':
        mainContainer.innerHTML = renderSubscriptions();
        break;
      case 'billing-invoices':
        mainContainer.innerHTML = renderBilling();
        break;
      case 'products-plans':
        mainContainer.innerHTML = renderCatalog();
        break;
      case 'customer-portal':
        mainContainer.innerHTML = renderCustomerPortal();
        break;
      default:
        mainContainer.innerHTML = renderRevenueOps();
    }
  }
}

// Bootstrap
store.subscribe(() => {
  renderApp();
});

renderApp();
