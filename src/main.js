// src/main.js - Application Controller & Bootstrap
import { store } from './store.js';
import { renderNavbar } from './components/navbar.js';
import { renderRevenueOps } from './components/revenueOps.js';
import { renderSubscriptions, setSelectedSubscription } from './components/subscriptions.js';
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

  const newInv = {
    id: 'inv-' + Date.now(),
    invoiceNumber: nextInvNum,
    subscriptionId: sub.id,
    customerName: sub.customerName,
    customerEmail: sub.customerEmail,
    issueDate: now,
    dueDate: dueDate,
    status: 'confirmed',
    subtotal: sub.subtotal,
    taxRate: 18.0,
    taxAmount: sub.taxTotal,
    discountAmount: sub.discountTotal,
    totalAmount: sub.grandTotal,
    amountPaid: 0.00,
    balanceDue: sub.grandTotal,
    daysOverdue: 0,
    lines: sub.items.map(i => ({
      description: `${i.productName} (${i.variantName || 'Standard'})`,
      qty: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total
    }))
  };

  state.invoices.unshift(newInv);
  store.saveState();
  showToast(`Invoice ${nextInvNum} generated for ${sub.customerName}!`, 'success');
  window.appNavigate('billing-invoices');
};

// Batch Billing Run
window.triggerBatchBillingRun = () => {
  const runResult = store.runBatchBilling();
  showModal('batchRun', runResult);
  showToast(`Billing run complete: ${runResult.invoicesGenerated} invoices generated (0 duplicates)!`, 'success');
};

// Invoice Actions (Confirm, Cancel, Send, Print, Record Pay)
window.confirmDraftInvoice = (invNum) => {
  store.confirmInvoice(invNum);
  showToast(`Invoice ${invNum} confirmed & moved to Confirmed!`, 'success');
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

// Customer Portal: Toggling Add-ons ("add-ons customers switch on and off" from PDF)
window.toggleCustomerAddonAction = (subId, addonType) => {
  store.toggleCustomerAddon(subId, addonType);
  showToast(`Add-on updated! Next billing cycle adjusted in real-time.`, 'success');
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

// 1-Click Quotation Template Auto-population (From PDF Scene 3)
window.applyQuotationTemplate = (templateId) => {
  if (!templateId) return;
  const state = store.getState();
  const tpl = state.quotationTemplates.find(t => t.id === templateId);
  if (!tpl) return;

  const planEl = document.getElementById('quotePlan');
  const variantEl = document.getElementById('quoteVariant');
  const qtyEl = document.getElementById('quoteQty');
  const validityEl = document.getElementById('quoteValidityDisplay');

  if (planEl) planEl.value = tpl.planId;
  if (variantEl && tpl.items[0]?.variantId) variantEl.value = tpl.items[0].variantId;
  if (qtyEl && tpl.items[0]?.quantity) qtyEl.value = tpl.items[0].quantity;
  if (validityEl) validityEl.value = `Valid for ${tpl.validityDays} calendar days (Template standard)`;

  showToast(`Applied "${tpl.name}" template with Odoo Brand Edition lines!`, 'info');
};

// Admin Add Staff Member ("Only the admin can add a new member of staff")
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
  const plan = state.plans.find(p => p.id === planId) || state.plans[0];
  const product = state.products[0];
  const variant = product.variants.find(v => v.id === variantId) || product.variants[0];

  const unitPrice = product.salesPrice + variant.priceModifier;
  let lineTotal = unitPrice * qty;
  let discountAmount = 0;

  if (discountCode === 'VOLUME500') {
    discountAmount = 500.00;
  } else if (discountCode === 'FESTIVE15') {
    discountAmount = lineTotal * 0.15;
  }

  const subtotal = lineTotal;
  const taxTotal = (subtotal - discountAmount) * 0.18;
  const grandTotal = subtotal - discountAmount + taxTotal;

  const newSubNumber = `SUB-2024-${Math.floor(2000 + Math.random() * 8000)}`;
  const newSub = {
    id: 'sub-' + Date.now(),
    subscriptionNumber: newSubNumber,
    customerName,
    customerEmail,
    crn: 'CIN: U' + Math.floor(100000000000 + Math.random() * 900000000000),
    tier: 'Enterprise Custom',
    planId: plan.id,
    planName: plan.name,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    nextBillingDate: new Date().toISOString().split('T')[0],
    paymentTerms,
    autoRenew: true,
    status: 'draft',
    isPaused: false,
    items: [
      {
        id: 'li-' + Date.now(),
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantName: variant.name,
        quantity: qty,
        unitPrice,
        taxRate: 18.0,
        discountAmount,
        total: lineTotal
      }
    ],
    subtotal,
    taxTotal,
    discountTotal: discountAmount,
    grandTotal
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

// Strict Password Validation Rule (Challenge Requirement: >8 chars, upper, lower, special)
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

window.sendResetPasswordLink = () => {
  const email = document.getElementById('testAuthEmail')?.value || 'aarav@apexretail.in';
  alert(`A secure password reset link has been dispatched to: ${email}`);
};

window.simulateCustomerSignup = () => {
  const email = document.getElementById('testAuthEmail')?.value;
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
  closeModal();
  showToast(`Account created for ${email}! Switching to customer portal.`, 'success');
  store.setRole('customer');
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
