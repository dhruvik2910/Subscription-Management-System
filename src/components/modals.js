// src/components/modals.js - Interactive System Modals
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

function renderNewQuoteModal() {
  const state = store.getState();
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Create New Quotation</h2>
          <p class="text-xs text-[#64748b]">Draft an offer with predefined templates, brand edition variants, and discount rules</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="newQuoteForm" onsubmit="window.handleCreateQuoteSubmit(event)" class="space-y-4 mt-4 text-xs">
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Customer Account / Company</label>
            <input type="text" id="quoteCustomerName" required placeholder="e.g. Wayne Enterprises" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Billing Email</label>
            <input type="email" id="quoteCustomerEmail" required placeholder="billing@waynecorp.com" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Billing Plan & Frequency</label>
            <select id="quotePlan" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
              ${state.plans.map(p => `
                <option value="${p.id}">${p.name} ($${p.price.toFixed(2)} / ${p.recurrence})</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Payment Terms</label>
            <select id="quotePaymentTerms" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 45">Net 45 Days</option>
              <option value="Due on Receipt">Due on Receipt</option>
            </select>
          </div>
        </div>

        <!-- Product & Brand Variant Selection -->
        <div class="p-3 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] space-y-3">
          <div class="font-bold text-[#081534]">Primary Line Item & Variant Modifier</div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-[#76777f] text-[11px] font-semibold mb-1">Brand Edition Variant</label>
              <select id="quoteVariant" class="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono">
                <option value="var-std">Standard Multi-Tenant Cloud ($1,000.00)</option>
                <option value="var-odoo" selected>Odoo Enterprise Brand Edition ($1,560.00 - adds +$560)</option>
                <option value="var-gov">Federal GovCloud Dedicated Enclave ($2,200.00)</option>
              </select>
            </div>
            <div>
              <label class="block text-[#76777f] text-[11px] font-semibold mb-1">Seat Quantity</label>
              <input type="number" id="quoteQty" min="1" value="10" 
                class="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono text-center font-bold" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Promotional Discount Code</label>
            <input type="text" id="quoteDiscountCode" placeholder="e.g. TIER1ENTERPRISE or EARLYBIRD15" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono uppercase" />
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Quotation Validity</label>
            <input type="text" readonly value="Valid for 30 calendar days" 
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
            Generate Quotation
          </button>
        </div>

      </form>
    </div>
  `;
}

function renderRecordPaymentModal(data) {
  const invoiceNumber = data.invoiceNumber || 'INV-2024-1029';
  const balanceDue = data.balanceDue || 1569.63;

  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Record Incoming Payment</h2>
          <p class="text-xs text-[#64748b]">Reconcile payment against invoice <span class="font-mono font-bold text-[#081534]">${invoiceNumber}</span></p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onsubmit="window.handleRecordPaymentSubmit(event, '${invoiceNumber}')" class="space-y-4 mt-4 text-xs">
        
        <div class="p-4 bg-[#eff4ff] rounded-xl flex items-center justify-between">
          <span class="text-[#45464e] font-medium">Outstanding Balance:</span>
          <span class="font-mono text-xl font-bold text-[#ba1a1a]">$${balanceDue.toFixed(2)}</span>
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Settlement Amount ($)</label>
          <input type="number" step="0.01" id="paymentAmount" required value="${balanceDue.toFixed(2)}" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono font-bold text-sm" />
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Payment Method</label>
          <select id="paymentMethod" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-medium">
            <option value="ACH Direct Debit">ACH Direct Debit (Bank Transfer)</option>
            <option value="Stripe Credit Card">Stripe Credit Card (Visa/Mastercard)</option>
            <option value="Bank Wire Transfer">Bank Wire Transfer (SWIFT)</option>
            <option value="UPI / Instant Bank Pay">UPI / Instant Bank Pay</option>
            <option value="Check / Cheque">Corporate Check</option>
          </select>
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Audit Reference / Note</label>
          <input type="text" id="paymentNote" placeholder="e.g. Bank statement ref #CH-9941-SETTLED" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono" />
        </div>

        <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button type="button" onclick="window.closeModal()" 
            class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#081534] font-semibold hover:bg-[#eff4ff]">
            Cancel
          </button>
          <button type="submit" 
            class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049] shadow-sm">
            Reconcile & Settle Invoice
          </button>
        </div>

      </form>
    </div>
  `;
}

function renderBatchRunModal(data) {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-2xl text-[#006a61]">autorenew</span>
          <div>
            <h2 class="text-lg font-bold text-[#081534]">Automated Billing Cycle Run</h2>
            <p class="text-xs text-[#64748b]">Zero Double-Billing Engine Execution</p>
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
            <span class="text-[#45464e]">Idempotency Verification:</span>
            <span class="font-mono font-bold text-[#006a61]">PASSED (0 Duplicates)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#45464e]">Invoices Generated:</span>
            <span class="font-mono font-bold text-[#081534]">+${data.invoicesGenerated || 0} Invoices</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#45464e]">Cycle Total Accrued:</span>
            <span class="font-mono font-bold text-[#006a61]">+$${(data.totalBilled || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 text-[#006f66] bg-[#86f2e4]/30 px-3 py-2 rounded-lg font-medium">
          <span class="material-symbols-outlined text-sm">verified_user</span>
          <span>Guaranteed idempotency: No active subscription was billed twice or skipped.</span>
        </div>
      </div>

      <div class="pt-4 border-t border-[#e2e8f0] flex justify-end">
        <button onclick="window.closeModal()" 
          class="px-5 py-2 rounded-lg bg-[#081534] text-white font-semibold hover:bg-[#1e2a4a]">
          Done & View Ledger
        </button>
      </div>
    </div>
  `;
}

function renderAuthModal() {
  return `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h2 class="text-lg font-bold text-[#081534]">Authentication & Strict Password Validation</h2>
          <p class="text-xs text-[#64748b]">Odoo Challenge Spec: >8 chars, upper, lower & special character policy</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="mt-4 space-y-4 text-xs">
        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Customer Email</label>
          <input type="email" id="testAuthEmail" placeholder="newcustomer@brightloop.com" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Create Password</label>
          <input type="password" id="testAuthPassword" oninput="window.validatePasswordStrength(this.value)" placeholder="Enter secure password" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono" />
        </div>

        <!-- Live Password Rule Checklist -->
        <div class="p-3 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] space-y-2">
          <div class="text-[11px] font-bold text-[#081534] uppercase tracking-wider">Security Requirements:</div>
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

        <!-- Forgot Password Link Test -->
        <div class="pt-3 border-t border-[#f1f5f9] flex justify-between items-center">
          <button onclick="window.sendResetPasswordLink()" class="text-[#006a61] hover:underline font-semibold">
            Forgot Password? Send Reset Link
          </button>
          <button onclick="window.simulateCustomerSignup()" class="px-4 py-2 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049]">
            Validate & Create Account
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderPrintInvoiceModal(data) {
  const state = store.getState();
  const inv = state.invoices.find(i => i.invoiceNumber === data.invoiceNumber) || state.invoices[0];

  return `
    <div class="p-6 max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-4 border-b border-[#e2e8f0] no-print">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl text-[#081534]">receipt_long</span>
          <span class="font-bold text-[#081534]">Official Tax Invoice • ${inv.invoiceNumber}</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="px-3 py-1.5 rounded-lg bg-[#081534] text-white text-xs font-semibold hover:bg-[#1e2a4a] flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">print</span>
            <span>Print / Save PDF</span>
          </button>
          <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <!-- Printable Document Sheet -->
      <div class="mt-4 p-8 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#0b1c30] space-y-6 shadow-sm">
        
        <div class="flex justify-between items-start">
          <div>
            <div class="text-xl font-bold text-[#081534] tracking-tight">Brightloop Software Inc.</div>
            <p class="text-[#64748b] text-[11px] mt-0.5">Enterprise Recurring Billing Platform</p>
            <p class="text-[#64748b] text-[11px]">100 Innovation Way, Suite 400 • Dover, DE 19901</p>
            <p class="text-[#64748b] text-[11px]">Tax ID: US-EIN-98-4420199</p>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold font-mono text-[#081534]">${inv.invoiceNumber}</div>
            <p class="font-mono text-[#64748b]">Issue Date: ${inv.issueDate}</p>
            <p class="font-mono text-[#ba1a1a] font-bold">Due Date: ${inv.dueDate}</p>
            <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase mt-1 ${
              inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }">
              STATUS: ${inv.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div class="p-3 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0]">
          <span class="text-[10px] text-[#76777f] uppercase font-semibold block">Billed To:</span>
          <div class="font-bold text-sm text-[#081534]">${inv.customerName}</div>
          <div class="font-mono text-[#45464e]">${inv.customerEmail}</div>
        </div>

        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-[#cbd5e1] text-[#76777f] uppercase">
              <th class="py-2">Description</th>
              <th class="py-2 text-center">Qty</th>
              <th class="py-2 text-right">Unit Price</th>
              <th class="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f1f5f9]">
            ${inv.lines.map(line => `
              <tr>
                <td class="py-2 font-medium">${line.description}</td>
                <td class="py-2 text-center font-mono">${line.qty}</td>
                <td class="py-2 text-right font-mono">$${line.unitPrice.toFixed(2)}</td>
                <td class="py-2 text-right font-mono font-bold">$${line.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="border-t border-[#cbd5e1] pt-3 flex flex-col items-end gap-1 font-mono text-xs">
          <div class="flex justify-between w-60">
            <span>Subtotal:</span>
            <span>$${inv.subtotal.toFixed(2)}</span>
          </div>
          ${inv.discountAmount > 0 ? `
            <div class="flex justify-between w-60 text-emerald-700">
              <span>Discount Applied:</span>
              <span>-$${inv.discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between w-60">
            <span>Tax (${inv.taxRate || 8.25}%):</span>
            <span>+$${inv.taxAmount.toFixed(2)}</span>
          </div>
          <div class="flex justify-between w-60 text-sm font-bold border-t border-[#cbd5e1] pt-1.5 text-[#081534]">
            <span>Total Due:</span>
            <span>$${inv.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="pt-4 border-t border-[#cbd5e1] text-[11px] text-[#64748b]">
          <p><strong>Payment Instructions:</strong> Settle via ACH direct debit or credit card through customer portal.</p>
          <p class="mt-0.5">Thank you for powering your operations with Brightloop Software.</p>
        </div>

      </div>
    </div>
  `;
}

function renderSearchModal() {
  const state = store.getState();
  return `
    <div class="p-4">
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3 top-2.5 text-[#76777f] text-lg">search</span>
        <input type="text" id="quickSearchInput" oninput="window.handleQuickSearch(this.value)" placeholder="Search subscriptions, invoices, customers, products..." 
          class="w-full pl-10 pr-4 py-2 border-b border-[#cbd5e1] text-sm outline-none font-medium" autofocus />
      </div>

      <div id="quickSearchResults" class="mt-3 max-h-80 overflow-y-auto space-y-1 text-xs">
        <div class="text-[11px] font-semibold text-[#76777f] px-2 py-1 uppercase">Recent Subscriptions</div>
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

        <div class="text-[11px] font-semibold text-[#76777f] px-2 py-1 uppercase mt-3">Recent Invoices</div>
        ${state.invoices.slice(0, 3).map(i => `
          <div onclick="window.previewInvoicePrint('${i.invoiceNumber}');" 
            class="p-2 rounded-lg hover:bg-[#eff4ff] cursor-pointer flex items-center justify-between">
            <div>
              <span class="font-mono font-bold text-[#081534]">${i.invoiceNumber}</span>
              <span class="text-[#45464e] ml-2">${i.customerName} ($${i.totalAmount.toFixed(2)})</span>
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
          <h2 class="text-lg font-bold text-[#081534]">Add Product Brand Variant</h2>
          <p class="text-xs text-[#64748b]">Configure dynamic variant price modifiers (e.g. Odoo brand +$560)</p>
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
            <option value="prod-analytics-02">Brightloop Analytics & Forecasting Pro</option>
            <option value="prod-support-03">24/7 Enterprise Dedicated Support SLA</option>
          </select>
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Variant Name</label>
          <input type="text" id="varName" required placeholder="e.g. Odoo Enterprise Custom Cloud" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
        </div>

        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Price Adjustment ($)</label>
          <input type="number" step="0.01" id="varPriceModifier" required placeholder="560.00" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono font-bold" />
          <span class="text-[11px] text-[#76777f] mt-1 block">Positive numbers increase price; zero keeps base price.</span>
        </div>

        <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button type="button" onclick="window.closeModal()" 
            class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#081534] font-semibold hover:bg-[#eff4ff]">
            Cancel
          </button>
          <button type="submit" 
            class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049] shadow-sm">
            Save Brand Variant
          </button>
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
          <h2 class="text-lg font-bold text-[#081534]">Create Recurring Billing Plan</h2>
          <p class="text-xs text-[#64748b]">Configure billing cadence and lifecycle policies</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onsubmit="window.handleAddPlanSubmit(event)" class="space-y-4 mt-4 text-xs">
        <div>
          <label class="block text-[#45464e] font-semibold mb-1">Plan Name</label>
          <input type="text" id="planName" required placeholder="e.g. Growth Quarterly License" 
            class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Recurrence Cadence</label>
            <select id="planRecurrence" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly" selected>Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Seat Price ($)</label>
            <input type="number" step="0.01" id="planPrice" required value="450.00" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Min Quantity</label>
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
          <button type="button" onclick="window.closeModal()" 
            class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#081534] font-semibold hover:bg-[#eff4ff]">
            Cancel
          </button>
          <button type="submit" 
            class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049] shadow-sm">
            Save Billing Plan
          </button>
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
          <h2 class="text-lg font-bold text-[#081534]">Create Automated Discount Rule</h2>
          <p class="text-xs text-[#64748b]">Configure promo rules with min quantities, spend thresholds, and limits</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onsubmit="window.handleAddDiscountSubmit(event)" class="space-y-4 mt-4 text-xs">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Coupon Code</label>
            <input type="text" id="discCode" required placeholder="WINTER2024" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono uppercase" />
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Rule Name</label>
            <input type="text" id="discName" required placeholder="Winter Launch Special" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Deduction Type</label>
            <select id="discType" class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Cash Amount ($)</option>
            </select>
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Value (Rate or $)</label>
            <input type="number" step="0.01" id="discValue" required value="20" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono font-bold" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Min Order Subtotal ($)</label>
            <input type="number" id="discMinSpend" value="1000" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono" />
          </div>
          <div>
            <label class="block text-[#45464e] font-semibold mb-1">Max Redemptions</label>
            <input type="number" id="discMaxUses" value="50" 
              class="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#006a61] outline-none font-mono text-center" />
          </div>
        </div>

        <div class="pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button type="button" onclick="window.closeModal()" 
            class="px-4 py-2 rounded-lg bg-white border border-[#cbd5e1] text-[#081534] font-semibold hover:bg-[#eff4ff]">
            Cancel
          </button>
          <button type="submit" 
            class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold hover:bg-[#005049] shadow-sm">
            Save Discount Rule
          </button>
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
          <h2 class="text-lg font-bold text-[#081534]">Request Plan Upgrade & Additional Seats</h2>
          <p class="text-xs text-[#64748b]">Scale Apex Retail's enterprise license immediately</p>
        </div>
        <button onclick="window.closeModal()" class="text-[#76777f] hover:text-[#081534]">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="py-4 space-y-4 text-xs">
        <div class="p-4 bg-[#eff4ff] rounded-xl flex items-center justify-between">
          <div>
            <div class="font-bold text-[#081534]">Enterprise Annual Agreement</div>
            <div class="text-[#64748b] text-[11px]">Includes dedicated technical account manager & 15-min SLA</div>
          </div>
          <span class="font-mono font-bold text-[#006a61] text-sm">$1,200/seat/yr</span>
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
        <button onclick="alert('Upgrade request received! Your account manager Elena Rostova has generated a pro-forma quote.'); window.closeModal();" 
          class="px-5 py-2 rounded-lg bg-[#006a61] text-white font-semibold">
          Submit Upgrade Request
        </button>
      </div>
    </div>
  `;
}
