// src/components/customerPortal.js - Clean, Human Customer Self-Service Portal
import { store } from '../store.js';

export function renderCustomerPortal() {
  const state = store.getState();
  
  // Dynamic current customer resolution with resilient fallback
  const customerUser = state.currentUser?.customer || {
    name: 'Aarav Patel',
    title: 'Head of Operations • Apex Retail Pvt Ltd',
    email: 'aarav@apexretail.in'
  };
  const customerEmail = customerUser.email || 'aarav@apexretail.in';
  const customerSub = state.subscriptions.find(s => s.customerEmail === customerEmail) || state.subscriptions.find(s => s.customerEmail === 'aarav@apexretail.in') || state.subscriptions[0];
  const customerInvoices = state.invoices.filter(i => i.customerEmail === customerEmail);
  const pendingInvoice = customerInvoices.find(i => i.status === 'overdue' || (i.balanceDue > 0 && i.status !== 'cancelled'));

  const addons = customerSub?.addonsEnabled || { analytics: true, support: true };
  const companyName = customerSub?.customerCompany || (customerUser.title?.includes('•') ? customerUser.title.split('•')[1].trim() : `${customerUser.name} Org`);
  const leadName = customerSub?.customerName || customerUser.name;
  const gstin = customerSub?.customerGstin || '24AAGCA1234N1Z5';

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in max-w-5xl mx-auto">
      
      <!-- Attention Notice if pending invoice exists -->
      ${pendingInvoice ? `
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-amber-600">error</span>
            <div class="text-xs">
              <strong>Pending Invoice Due:</strong> Invoice <span class="font-mono font-bold">${pendingInvoice.invoiceNumber}</span> (₹${pendingInvoice.balanceDue.toFixed(2)}) is awaiting payment. Settle via UPI to keep services active.
            </div>
          </div>
          <button onclick="window.openRecordPaymentModal('${pendingInvoice.invoiceNumber}', ${pendingInvoice.balanceDue})" 
            class="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all shrink-0">
            Pay Now (₹${pendingInvoice.balanceDue.toFixed(2)})
          </button>
        </div>
      ` : `
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-emerald-800 text-xs">
          <span class="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
          <span>Your account is in good standing. All subscription invoices are paid up to date.</span>
        </div>
      `}

      <!-- Customer Account Header -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h1 class="text-2xl font-bold text-[#081534] tracking-tight">${companyName}</h1>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active
            </span>
          </div>
          <p class="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            <span>Lead: <strong>${leadName}</strong></span>
            <span>•</span>
            <span class="font-mono text-slate-400">GSTIN: ${gstin}</span>
          </p>
        </div>

        <div class="text-left sm:text-right">
          <div class="text-[11px] text-slate-400 uppercase tracking-wider">Current Plan</div>
          <div class="text-sm font-bold text-slate-800">${customerSub?.planName || 'Monthly Professional'}</div>
          <div class="text-xs font-mono text-slate-500">₹${(customerSub?.totalAmount || 0).toFixed(2)} / month</div>
        </div>
      </div>

      <!-- Modular Add-Ons Configuration -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 class="text-base font-bold text-[#081534]">Modular Subscription Add-ons</h2>
          <p class="text-xs text-slate-500">Toggle add-ons on or off. Changes reflect immediately on your next billing cycle.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <!-- Add-on 1: Developer API -->
          <div class="p-4 rounded-xl border ${addons.analytics ? 'border-teal-200 bg-teal-50/20' : 'border-slate-200 bg-white'} transition-all flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold text-sm text-slate-900">Developer REST API & Webhooks</div>
              <p class="text-xs text-slate-500 mt-0.5">High-volume webhook ingestion and custom endpoints.</p>
              <div class="font-mono text-xs font-semibold text-teal-800 mt-2">+₹1,250.00 / month</div>
            </div>
            <button onclick="window.toggleAddon('analytics')" 
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${addons.analytics ? 'bg-teal-700' : 'bg-slate-200'}">
              <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${addons.analytics ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
          </div>

          <!-- Add-on 2: Dedicated 24/7 SLA -->
          <div class="p-4 rounded-xl border ${addons.support ? 'border-teal-200 bg-teal-50/20' : 'border-slate-200 bg-white'} transition-all flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold text-sm text-slate-900">24/7 Dedicated Support SLA</div>
              <p class="text-xs text-slate-500 mt-0.5">Guaranteed 15-minute response time with dedicated account manager.</p>
              <div class="font-mono text-xs font-semibold text-teal-800 mt-2">+₹2,500.00 / month</div>
            </div>
            <button onclick="window.toggleAddon('support')" 
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${addons.support ? 'bg-teal-700' : 'bg-slate-200'}">
              <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${addons.support ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
          </div>

        </div>
      </div>

      <!-- Invoices & Receipts Ledger -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 class="text-base font-bold text-[#081534]">Your Invoices & Tax Receipts</h2>
          <p class="text-xs text-slate-500">Official GST compliant tax invoices with payment breakdown</p>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold text-[11px]">
                <th class="py-2.5 px-3">Invoice #</th>
                <th class="py-2.5 px-3">Issue Date</th>
                <th class="py-2.5 px-3">Due Date</th>
                <th class="py-2.5 px-3 text-right">Amount (₹)</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${customerInvoices.length === 0 ? `
                <tr>
                  <td colspan="6" class="py-8 text-center text-slate-400">No invoices recorded yet.</td>
                </tr>
              ` : customerInvoices.map(inv => `
                <tr class="hover:bg-slate-50/70">
                  <td class="py-3 px-3 font-mono font-semibold text-[#081534]">${inv.invoiceNumber}</td>
                  <td class="py-3 px-3 font-mono text-slate-600">${inv.invoiceDate || inv.issueDate}</td>
                  <td class="py-3 px-3 font-mono text-slate-600">${inv.dueDate}</td>
                  <td class="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                    ₹${inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td class="py-3 px-3">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                      inv.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }">
                      <span class="w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                      ${inv.status}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      <button onclick="window.previewInvoicePDF('${inv.invoiceNumber}')" 
                        class="px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors">
                        Tax Invoice
                      </button>
                      ${inv.balanceDue > 0 ? `
                        <button onclick="window.openRecordPaymentModal('${inv.invoiceNumber}', ${inv.balanceDue})" 
                          class="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors">
                          Pay Now
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
