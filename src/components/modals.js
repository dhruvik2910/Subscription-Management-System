// src/components/modals.js - Interactive System Modals in Rupees (₹)
import { store } from '../store.js';

let activeModal = null;
let modalData = {};

export function showModal(name, data = {}) {
  activeModal = name;
  modalData = data;
  renderModalContainer();
}

export function closeModal() {
  activeModal = null;
  modalData = {};
  renderModalContainer();
}

export function renderModalContainer() {
  const container = document.getElementById('modal-root');
  if (!container) return;

  if (!activeModal) {
    container.innerHTML = '';
    return;
  }

  let content = '';
  switch (activeModal) {
    case 'newQuote':
      content = renderNewQuoteModal();
      break;
    case 'recordPayment':
      content = renderRecordPaymentModal(modalData);
      break;
    case 'batchRun':
      content = renderBatchRunModal(modalData);
      break;
    case 'staffManagement':
      content = renderStaffManagementModal();
      break;
    case 'addVariant':
      content = renderAddVariantModal();
      break;
    case 'addPlan':
      content = renderAddPlanModal();
      break;
    case 'addDiscount':
      content = renderAddDiscountModal();
      break;
    case 'auth':
      content = renderAuthModal();
      break;
    case 'printInvoice':
      content = renderPrintInvoiceModal(modalData);
      break;
    case 'search':
      content = renderSearchModal();
      break;
    case 'upgrade':
      content = renderUpgradeModal();
      break;
    default:
      content = '';
  }

  container.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-[#081534]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#cbd5e1] overflow-hidden animate-scale-up" onclick="event.stopPropagation()">
        ${content}
      </div>
    </div>
  `;
}

// 1. New Quote Modal with 1-Click Quotation Template Selector
function renderNewQuoteModal() {
  const state = store.getState();
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Create New Quotation</h2>
          <p class="text-xs text-[#64748b]">Select a predefined template or customize products, variants, and discounts</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="newQuoteForm" onsubmit="window.handleCreateQuoteSubmit(event)" class="space-y-4 mt-4 text-xs">
        
        <!-- 1-Click Quotation Template Selector -->
        <div class="p-3 bg-[#eff4ff] rounded-xl border border-[#dce9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#006a61]">auto_stories</span>
            <div>
              <div class="font-bold text-[#081534]">Use Quotation Template</div>
              <div class="text-[11px] text-[#64748b]">Auto-fills plan, products, variants, and validity window</div>
            </div>
          </div>
          <select id="quoteTemplateSelector" onchange="window.applyQuotationTemplate(this.value)" 
            class="px-2.5 py-1.5 rounded-lg border border-[#cbd5e1] bg-white font-medium text-xs text-[#081534] outline-none">
            <option value="">-- Choose Template --</option>
            ${state.quotationTemplates.map(t => `
              <option value="${t.id}">${t.name} (${t.validityDays} Days)</option>
            `).join('')}
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Customer / Company Name</label>
            <input type="text" id="quoteCustomerName" required placeholder="e.g. Tata Digital Pvt Ltd" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Billing Email</label>
            <input type="email" id="quoteCustomerEmail" required placeholder="billing@tatadigital.in" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Billing Plan & Frequency</label>
            <select id="quotePlan" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
              ${state.plans.map(p => `
                <option value="${p.id}">${p.name} (₹${p.price.toFixed(2)} / ${p.recurrence})</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Payment Terms</label>
            <select id="quotePaymentTerms" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 15 Days">Net 15 Days</option>
              <option value="Net 45 Days">Net 45 Days</option>
              <option value="Due on Receipt">Due on Receipt</option>
            </select>
          </div>
        </div>

        <!-- Product & Brand Variant Selection -->
        <div class="p-3 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] space-y-3">
          <div class="font-bold text-[#081534] flex items-center justify-between">
            <span>Product & Brand Edition Variant</span>
            <span class="text-[11px] text-[#006a61] font-mono font-semibold">Odoo Brand: +₹560</span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-[#76777f] text-[11px] font-semibold mb-1">Brand Edition Variant</label>
              <select id="quoteVariant" class="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono">
                ${((state.products[0]?.variants) || [
                  { id: 'var-core-standard', name: 'Standard Cloud Edition', priceModifier: 0 },
                  { id: 'var-core-odoo', name: 'Odoo Connected Edition (+₹560)', priceModifier: 560 },
                  { id: 'var-core-enterprise', name: 'Enterprise Dedicated (+₹2,400)', priceModifier: 2400 }
                ]).map(v => {
                  const vId = v.id;
                  const vName = v.name || v.variant_name || 'Standard Edition';
                  const extra = v.priceModifier !== undefined ? v.priceModifier : (v.extra_price || 0);
                  const isOdoo = vName.toLowerCase().includes('odoo');
                  return `<option value="${vId}" ${isOdoo ? 'selected' : ''}>${vName} (+₹${extra.toFixed(2)})</option>`;
                }).join('')}
              </select>
            </div>
            <div>
              <label class="block text-[#76777f] text-[11px] font-semibold mb-1">Seats / Quantity</label>
              <input type="number" id="quoteQty" min="1" value="10" 
                class="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono text-center font-bold" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Discount Code (Optional)</label>
            <input type="text" id="quoteDiscountCode" placeholder="VOLUME500 or FESTIVE15" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono uppercase" />
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Quote Validity Window</label>
            <input type="text" id="quoteValidityDisplay" readonly value="Valid for 30 calendar days" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg bg-slate-50 text-[#76777f]" />
          </div>
        </div>

        <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button type="button" onclick="window.closeModal()" 
            class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#081534] font-semibold hover:bg-[#eff4ff]">
            Cancel
          </button>
          <button type="submit" 
            class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049] shadow-sm">
            Generate Quotation (Draft)
          </button>
        </div>

      </form>
    </div>
  `;
}

// 2. Staff Management Modal
function renderStaffManagementModal() {
  const state = store.getState();
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-[#081534]">Internal Staff Management</h2>
            <span class="px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] font-mono text-[10px] font-bold">Admin Only</span>
          </div>
          <p class="text-xs text-[#64748b]">Per business requirements: Only the admin can add a new member of staff.</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Add Staff Form -->
      <form onsubmit="window.handleAddStaffSubmit(event)" class="mt-4 p-4 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] space-y-3 text-xs">
        <div class="font-bold text-[#081534] flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-[#006a61]">person_add</span>
          <span>Add New Staff Member</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[#45464e] font-medium mb-1">Full Name</label>
            <input type="text" id="newStaffName" required placeholder="e.g. Ananya Rao" 
              class="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-lg outline-none focus:ring-2 focus:ring-[#006a61] bg-white" />
          </div>
          <div>
            <label class="block text-[#45464e] font-medium mb-1">Work Email</label>
            <input type="email" id="newStaffEmail" required placeholder="ananya@brightloop.in" 
              class="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-lg outline-none focus:ring-2 focus:ring-[#006a61] bg-white" />
          </div>
          <div>
            <label class="block text-[#45464e] font-medium mb-1">Operational Role</label>
            <select id="newStaffRole" class="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-lg outline-none focus:ring-2 focus:ring-[#006a61] bg-white font-medium">
              <option value="Sales & Billing Specialist">Sales & Billing Specialist</option>
              <option value="Customer Success Lead">Customer Success Lead</option>
              <option value="Billing Operations Associate">Billing Operations Associate</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button type="submit" class="px-4 py-1.5 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049] transition-all">
            + Onboard Staff Member
          </button>
        </div>
      </form>

      <!-- Active Staff Members Table -->
      <div class="mt-4">
        <h3 class="text-xs font-bold text-[#081534] uppercase tracking-wider mb-2">Current Active Team Members</h3>
        <div class="overflow-x-auto border border-[#e2e8f0] rounded-xl">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#cbd5e1] bg-[#f8f9ff] text-[#76777f] font-semibold">
                <th class="py-2 px-3">Name</th>
                <th class="py-2 px-3">Email</th>
                <th class="py-2 px-3">Role</th>
                <th class="py-2 px-3">Joined</th>
                <th class="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f1f5f9]">
              ${(state.staffMembers || []).map(s => `
                <tr class="hover:bg-[#f8f9ff]">
                  <td class="py-2.5 px-3 font-semibold text-[#081534]">${s.name}</td>
                  <td class="py-2.5 px-3 font-mono text-[#45464e]">${s.email}</td>
                  <td class="py-2.5 px-3 text-[#45464e]">${s.role_title || s.role || 'Billing Specialist'}${s.department ? ` • ${s.department}` : ''}</td>
                  <td class="py-2.5 px-3 font-mono text-[#76777f]">${s.created_at ? s.created_at.substring(0, 10) : (s.joined || 'Today')}</td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] font-mono text-[10px] font-bold">Active</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="pt-4 border-t border-[#e2e8f0] mt-4 flex justify-end">
        <button onclick="window.closeModal()" class="px-4 py-2 rounded-lg bg-[#081534] text-white text-xs font-semibold">
          Done
        </button>
      </div>
    </div>
  `;
}

// 3. Record Payment Modal (UPI, Net Banking, Cards, Cheque in ₹)
function renderRecordPaymentModal(data) {
  const invoiceNumber = data.invoiceNumber || 'INV-2024-1029';
  const balanceDue = data.balanceDue || 1711.00;

  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Record Payment</h2>
          <p class="text-xs text-[#64748b]">Reconcile incoming payment for invoice <span class="font-mono font-bold text-[#081534]">${invoiceNumber}</span></p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onsubmit="window.handleRecordPaymentSubmit(event, '${invoiceNumber}')" class="space-y-4 mt-4 text-xs">
        
        <div class="p-4 bg-[#eff4ff] rounded-xl flex items-center justify-between">
          <span class="text-[#45464e] font-medium">Balance Due:</span>
          <span class="font-mono text-xl font-bold text-[#ba1a1a]">₹${balanceDue.toFixed(2)}</span>
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Settlement Amount (INR ₹)</label>
          <input type="number" step="0.01" id="paymentAmount" required value="${balanceDue.toFixed(2)}" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono font-bold text-sm" />
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Payment Method</label>
          <select id="paymentMethod" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-medium">
            <option value="UPI (Corporate GPay / PhonePe)">UPI (Corporate GPay / PhonePe)</option>
            <option value="Net Banking (HDFC Corporate)">Net Banking (HDFC Corporate)</option>
            <option value="Net Banking (ICICI / SBI)">Net Banking (ICICI / SBI)</option>
            <option value="NEFT / RTGS Wire">NEFT / RTGS Wire Transfer</option>
            <option value="Corporate Credit Card">Corporate Credit Card (Visa/Mastercard)</option>
            <option value="Cheque Deposit">Corporate Cheque</option>
          </select>
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Transaction Reference / UTR Number</label>
          <input type="text" id="paymentNote" placeholder="e.g. UTR #HDFC0001928491 or UPI Ref #4289102" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono" />
        </div>

        <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button type="button" onclick="window.closeModal()" 
            class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#081534] font-semibold hover:bg-[#eff4ff]">
            Cancel
          </button>
          <button type="submit" 
            class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049] shadow-sm">
            Confirm Payment & Mark Paid
          </button>
        </div>

      </form>
    </div>
  `;
}

// 4. Batch Billing Run Simulator Modal
function renderBatchRunModal(data) {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-2xl text-[#006a61]">autorenew</span>
          <div>
            <h2 class="text-lg font-bold text-[#081534]">Billing Day Cycle Complete</h2>
            <p class="text-xs text-[#64748b]">Automated recurring billing run</p>
          </div>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="py-6 space-y-4 text-xs">
        <div class="p-4 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[#45464e]">Active Contracts Scanned:</span>
            <span class="font-mono font-bold text-[#081534]">${data.subscriptionsProcessed || 4} Contracts</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#45464e]">Duplicate Prevention Check:</span>
            <span class="font-mono font-bold text-[#006a61]">PASSED (0 Duplicates)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#45464e]">Invoices Created:</span>
            <span class="font-mono font-bold text-[#081534]">+${data.invoicesGenerated || 0} Invoices</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#45464e]">Cycle Total Accrued:</span>
            <span class="font-mono font-bold text-[#006a61]">+₹${(data.totalBilled || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 text-[#006f66] bg-[#86f2e4]/30 px-3 py-2 rounded-lg font-medium">
          <span class="material-symbols-outlined text-sm">verified_user</span>
          <span>Zero duplicates, zero skipped cycles. Automated 18% GST rules applied.</span>
        </div>
      </div>

      <div class="pt-4 border-t border-[#e2e8f0] flex justify-end">
        <button onclick="window.closeModal()" 
          class="px-5 py-2 rounded-lg bg-[#081534] text-white font-semibold hover:bg-[#1e2a4a]">
          Done & View Invoices
        </button>
      </div>
    </div>
  `;
}

// 5. Auth Modal: Strict Password Policy (>8 chars, uppercase, lowercase, special char)
function renderAuthModal() {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Customer Signup & Password Policy</h2>
          <p class="text-xs text-[#64748b]">Security Standard: 8+ characters with uppercase, lowercase & special character</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="mt-4 space-y-4 text-xs">
        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Work Email</label>
          <input type="email" id="testAuthEmail" placeholder="customer@company.in" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Create Secure Password</label>
          <input type="password" id="testAuthPassword" oninput="window.validatePasswordStrength(this.value)" placeholder="Enter password to test policy" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono" />
        </div>

        <!-- Live Password Rules -->
        <div class="p-3 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] space-y-2">
          <div class="text-[11px] font-bold text-[#081534] uppercase tracking-wider">Password Rules Checklist:</div>
          <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div id="ruleLen" class="flex items-center gap-1.5 text-[#76777f]">
              <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
              <span>More than 8 chars</span>
            </div>
            <div id="ruleUpper" class="flex items-center gap-1.5 text-[#76777f]">
              <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
              <span>1+ Uppercase letter</span>
            </div>
            <div id="ruleLower" class="flex items-center gap-1.5 text-[#76777f]">
              <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
              <span>1+ Lowercase letter</span>
            </div>
            <div id="ruleSpecial" class="flex items-center gap-1.5 text-[#76777f]">
              <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
              <span>1+ Special character</span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-[#f1f5f9] flex justify-between items-center">
          <button onclick="window.sendResetPasswordLink()" class="text-[#006a61] hover:underline font-semibold">
            Forgot Password? Send Reset Link
          </button>
          <button onclick="window.simulateCustomerSignup()" class="px-4 py-2 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049]">
            Verify & Create Account
          </button>
        </div>
      </div>
    </div>
  `;
}

// 6. Printable Official Tax Invoice in Rupees (₹)
function renderPrintInvoiceModal(data) {
  const state = store.getState();
  const searchKey = data.invoiceNumber || data.subscriptionId;
  const inv = state.invoices.find(i => i.invoiceNumber === searchKey || i.id === searchKey) ||
              state.subscriptions.find(s => s.subscriptionNumber === searchKey || s.id === searchKey) ||
              state.invoices[0] || {};

  const isQuotation = !inv.invoiceNumber && Boolean(inv.subscriptionNumber);
  const docTitle = isQuotation ? 'Quotation' : 'Tax Invoice';
  const docNumber = inv.invoiceNumber || inv.subscriptionNumber || 'DOC-2024-001';
  const docDate = inv.issueDate || inv.invoiceDate || inv.startDate || new Date().toISOString().split('T')[0];
  const docDueDate = inv.dueDate || inv.expiryDate || inv.nextBillingDate || '-';
  const docStatus = inv.status || 'confirmed';

  const lines = inv.lines || inv.items || [];
  const subtotal = inv.subtotal !== undefined ? inv.subtotal : (inv.totalAmount || 0);
  const discountAmount = inv.discountAmount !== undefined ? inv.discountAmount : (inv.discount_amount || 0);
  const gstAmount = inv.gstAmount !== undefined ? inv.gstAmount : (inv.taxAmount !== undefined ? inv.taxAmount : (subtotal * 0.18));
  const totalAmount = inv.totalAmount !== undefined ? inv.totalAmount : (inv.grandTotal || (subtotal + gstAmount));

  return `
    <div class="p-6 max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0] no-print">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl text-[#081534]">receipt_long</span>
          <span class="font-bold text-[#081534]">${docTitle} • ${docNumber}</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="px-3 py-1.5 rounded-lg bg-[#081534] text-white text-xs font-semibold hover:bg-[#1e2a4a] flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">print</span>
            <span>Print / PDF</span>
          </button>
          <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <!-- Printable Invoice Sheet in INR -->
      <div class="mt-4 p-8 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#0b1c30] space-y-6 shadow-sm">
        
        <div class="flex justify-between items-start">
          <div>
            <div class="text-xl font-bold text-[#081534] tracking-tight">Brightloop Software Pvt Ltd</div>
            <p class="text-[#64748b] text-[11px] mt-0.5">Subscription & Cloud Systems</p>
            <p class="text-[#64748b] text-[11px]">7th Floor, Mindspace Tech Park • Mumbai, MH 400064</p>
            <p class="text-[#64748b] text-[11px] font-mono">GSTIN: 27AABCB1234F1Z0</p>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold font-mono text-[#081534]">${docNumber}</div>
            <p class="font-mono text-[#64748b]">Date: ${docDate}</p>
            <p class="font-mono text-[#ba1a1a] font-bold">Due Date: ${docDueDate}</p>
            <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase mt-1 ${
              docStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : docStatus === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-sky-100 text-sky-800'
            }">
              STATUS: ${docStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div class="p-3 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0]">
          <span class="text-[10px] text-[#76777f] uppercase font-semibold block">Billed To:</span>
          <div class="font-bold text-sm text-[#081534]">${inv.customerName || 'Customer'}</div>
          <div class="font-mono text-[#45464e]">${inv.customerEmail || ''}</div>
          <div class="font-mono text-[11px] text-[#64748b] mt-0.5">GSTIN: ${inv.customerGstin || 'Unregistered'}</div>
        </div>

        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-[#cbd5e1] text-[#76777f] uppercase font-semibold">
              <th class="py-2">Description</th>
              <th class="py-2 text-center">Qty</th>
              <th class="py-2 text-right">Unit Price</th>
              <th class="py-2 text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f1f5f9]">
            ${lines.length === 0 ? `
              <tr>
                <td class="py-2 font-medium">${inv.planName || 'SaaS Subscription'}</td>
                <td class="py-2 text-center font-mono">1</td>
                <td class="py-2 text-right font-mono">₹${subtotal.toFixed(2)}</td>
                <td class="py-2 text-right font-mono font-bold">₹${subtotal.toFixed(2)}</td>
              </tr>
            ` : lines.map(line => {
              const desc = line.description || `${line.productName || line.product_name || 'Software'} (${line.variantName || line.variant_name || 'Standard'})`;
              const qty = line.qty !== undefined ? line.qty : (line.quantity || 1);
              const uPrice = line.unitPrice !== undefined ? line.unitPrice : (line.unit_price || 0);
              const tot = line.total !== undefined ? line.total : (line.subtotal !== undefined ? line.subtotal : (uPrice * qty));
              return `
                <tr>
                  <td class="py-2 font-medium">${desc}</td>
                  <td class="py-2 text-center font-mono">${qty}</td>
                  <td class="py-2 text-right font-mono">₹${uPrice.toFixed(2)}</td>
                  <td class="py-2 text-right font-mono font-bold">₹${tot.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="border-t border-[#cbd5e1] pt-3 flex flex-col items-end gap-1 font-mono text-xs">
          <div class="flex justify-between w-60">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="flex justify-between w-60 text-emerald-700">
              <span>Discount Applied:</span>
              <span>-₹${discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between w-60">
            <span>GST (18%):</span>
            <span>+₹${gstAmount.toFixed(2)}</span>
          </div>
          <div class="flex justify-between w-60 text-sm font-bold border-t border-[#cbd5e1] pt-1.5 text-[#081534]">
            <span>Total Payable:</span>
            <span>₹${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="pt-4 border-t border-[#cbd5e1] text-[11px] text-[#64748b]">
          <p><strong>Payment Options:</strong> Settle via UPI (GPay/PhonePe) or Net Banking mandate in customer portal.</p>
        </div>

      </div>
    </div>
  `;
}

// 7. Search Modal
function renderSearchModal() {
  const state = store.getState();
  return `
    <div class="p-4">
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3 top-2.5 text-[#76777f] text-lg">search</span>
        <input type="text" id="quickSearchInput" oninput="window.handleQuickSearch(this.value)" placeholder="Search subscriptions, invoices, customers..." 
          class="w-full pl-10 pr-4 py-2 border-b border-[#cbd5e1] text-sm outline-none font-medium" autofocus />
      </div>

      <div id="quickSearchResults" class="mt-3 max-h-80 overflow-y-auto space-y-1 text-xs">
        <div class="text-[11px] font-semibold text-[#76777f] px-2 py-1 uppercase">Subscriptions</div>
        ${state.subscriptions.map(s => `
          <div onclick="window.selectSubscriptionRecord('${s.id}'); window.appNavigate('subscriptions-quotes'); window.closeModal();" 
            class="p-2 rounded-lg hover:bg-[#eff4ff] cursor-pointer flex items-center justify-between">
            <div>
              <span class="font-mono font-bold text-[#081534]">${s.subscriptionNumber}</span>
              <span class="text-[#45464e] ml-2">${s.customerName}</span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#dce9ff] text-[#081534]">${s.status}</span>
          </div>
        `).join('')}

        <div class="text-[11px] font-semibold text-[#76777f] px-2 py-1 uppercase mt-3">Invoices</div>
        ${state.invoices.slice(0, 3).map(i => `
          <div onclick="window.previewInvoicePrint('${i.invoiceNumber}');" 
            class="p-2 rounded-lg hover:bg-[#eff4ff] cursor-pointer flex items-center justify-between">
            <div>
              <span class="font-mono font-bold text-[#081534]">${i.invoiceNumber}</span>
              <span class="text-[#45464e] ml-2">${i.customerName} (₹${i.totalAmount.toFixed(2)})</span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase ${i.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">${i.status}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAddVariantModal() {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Add Brand Variant</h2>
          <p class="text-xs text-[#64748b]">Configure dynamic price modifier (e.g. Odoo brand +₹560)</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onsubmit="window.handleAddVariantSubmit(event)" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Target Product</label>
          <select id="varTargetProduct" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
            <option value="prod-erp-01">Brightloop ERP Suite</option>
            <option value="prod-analytics-02">Analytics & Revenue Forecasting</option>
            <option value="prod-support-03">24/7 Dedicated Support SLA</option>
          </select>
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Variant Name</label>
          <input type="text" id="varName" required placeholder="e.g. Odoo Custom Cloud Edition" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Price Adjustment (₹)</label>
          <input type="number" step="0.01" id="varPriceModifier" required placeholder="560.00" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono font-bold" />
        </div>

        <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#081534]">Cancel</button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold">Save Variant</button>
        </div>
      </form>
    </div>
  `;
}

function renderAddPlanModal() {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Create Subscription Plan</h2>
          <p class="text-xs text-[#64748b]">Configure billing frequency and end-of-term behavior</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onsubmit="window.handleAddPlanSubmit(event)" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Plan Name</label>
          <input type="text" id="planName" required placeholder="e.g. Annual Growth Tier" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Billing Frequency</label>
            <select id="planRecurrence" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly" selected>Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Seat Price (₹)</label>
            <input type="number" step="0.01" id="planPrice" required value="450.00" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Min Seats</label>
            <input type="number" id="planMinQty" min="1" value="1" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono text-center" />
          </div>
          <div class="flex items-center gap-3 pt-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="planAllowPause" checked class="rounded text-[#006a61]" />
              <span>Allow Pausing</span>
            </label>
          </div>
        </div>

        <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1]">Cancel</button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold">Save Plan</button>
        </div>
      </form>
    </div>
  `;
}

function renderAddDiscountModal() {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Create Discount Rule</h2>
          <p class="text-xs text-[#64748b]">Configure promo codes with spend thresholds and usage limits</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onsubmit="window.handleAddDiscountSubmit(event)" class="space-y-4 mt-4 text-xs">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Coupon Code</label>
            <input type="text" id="discCode" required placeholder="SAVE500" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono uppercase" />
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Rule Name</label>
            <input type="text" id="discName" required placeholder="Festive Special" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Discount Type</label>
            <select id="discType" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
              <option value="fixed">Fixed Deduction (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Value (₹ or %)</label>
            <input type="number" step="0.01" id="discValue" required value="500" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono font-bold" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Min Order Subtotal (₹)</label>
            <input type="number" id="discMinSpend" value="2000" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono" />
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Max Uses</label>
            <input type="number" id="discMaxUses" value="50" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono text-center" />
          </div>
        </div>

        <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1]">Cancel</button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold">Save Rule</button>
        </div>
      </form>
    </div>
  `;
}

function renderUpgradeModal() {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Request Additional Seats</h2>
          <p class="text-xs text-[#64748b]">Scale your team's subscription</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="py-4 space-y-4 text-xs">
        <div class="p-4 bg-[#eff4ff] rounded-xl flex items-center justify-between">
          <div>
            <div class="font-bold text-[#081534]">Brightloop ERP Suite (Standard Edition)</div>
            <div class="text-[#64748b] text-[11px]">Billed monthly on contract</div>
          </div>
          <span class="font-mono font-bold text-[#006a61] text-sm">₹1,000 / seat / mo</span>
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Additional Seats Requested</label>
          <input type="number" min="1" value="5" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg font-mono text-center font-bold" />
        </div>
      </div>

      <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
        <button onclick="window.closeModal()" class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#081534] font-semibold">
          Cancel
        </button>
        <button onclick="alert('Seat upgrade request submitted! Your account manager Rohan Mehta will apply it to your next billing cycle.'); window.closeModal();" 
          class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold">
          Submit Request
        </button>
      </div>
    </div>
  `;
}
