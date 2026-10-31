// src/components/billing.js - Clean, Human Invoices & Automated Billing Console
import { store } from '../store.js';

let invoiceFilter = 'all'; // 'all' | 'confirmed' | 'paid' | 'overdue' | 'draft'
let invoiceSearch = '';

export function setInvoiceFilter(filter) {
  invoiceFilter = filter;
}

export function setInvoiceSearch(term) {
  invoiceSearch = term;
}

export function renderBilling() {
  const state = store.getState();
  
  const filteredInvoices = state.invoices.filter(inv => {
    const matchesFilter = invoiceFilter === 'all' || inv.status === invoiceFilter;
    const invNum = inv.invoiceNumber || inv.invoice_number || '';
    const custName = inv.customerName || inv.customer_name || '';
    const matchesSearch = !invoiceSearch || 
      invNum.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      custName.toLowerCase().includes(invoiceSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalBilled = state.invoices.reduce((acc, inv) => acc + (inv.status !== 'cancelled' ? (inv.totalAmount || inv.total_amount || 0) : 0), 0);
  const totalCollected = state.invoices.reduce((acc, inv) => acc + (inv.amountPaid !== undefined ? inv.amountPaid : (inv.amount_paid || 0)), 0);
  const totalOutstanding = state.invoices.reduce((acc, inv) => acc + (inv.status !== 'cancelled' ? (inv.balanceDue !== undefined ? inv.balanceDue : (inv.balance_due || 0)) : 0), 0);

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Top Header & Primary Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Billing & Invoices</h1>
          <p class="text-xs text-slate-500 mt-1">
            Automated recurring billing cycles, GST tax invoices, and real-time payment reconciliation.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button onclick="window.triggerBatchBillingRun()" 
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#081534] hover:bg-[#1e2a4a] text-white text-xs font-semibold shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">autorenew</span>
            <span>Run Billing Cycle</span>
          </button>

          <button onclick="window.exportLedgerCSV()" 
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium border border-slate-200 shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm text-slate-500">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Clean 3-Metric Summary Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">Total Invoiced</div>
          <div class="mt-1 font-mono text-xl font-bold text-[#081534]">
            ₹${totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">Collected via Payments</div>
          <div class="mt-1 font-mono text-xl font-bold text-teal-700">
            ₹${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">Pending Balance Due</div>
          <div class="mt-1 font-mono text-xl font-bold ${totalOutstanding > 0 ? 'text-amber-700' : 'text-slate-800'}">
            ₹${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <!-- Filter Tabs & Search Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div class="flex items-center gap-1 text-xs font-medium overflow-x-auto">
          <button onclick="window.setInvoiceFilterTab('all')" 
            class="pb-2 px-3 border-b-2 transition-colors ${invoiceFilter === 'all' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            All Invoices (${state.invoices.length})
          </button>
          <button onclick="window.setInvoiceFilterTab('confirmed')" 
            class="pb-2 px-3 border-b-2 transition-colors ${invoiceFilter === 'confirmed' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            Confirmed (${state.invoices.filter(i => i.status === 'confirmed').length})
          </button>
          <button onclick="window.setInvoiceFilterTab('paid')" 
            class="pb-2 px-3 border-b-2 transition-colors ${invoiceFilter === 'paid' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            Paid (${state.invoices.filter(i => i.status === 'paid').length})
          </button>
          <button onclick="window.setInvoiceFilterTab('overdue')" 
            class="pb-2 px-3 border-b-2 transition-colors ${invoiceFilter === 'overdue' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            Overdue (${state.invoices.filter(i => i.status === 'overdue').length})
          </button>
        </div>

        <div class="relative w-full sm:w-64">
          <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-sm text-slate-400">search</span>
          <input type="text" placeholder="Search invoice or customer..." 
            value="${invoiceSearch}"
            oninput="window.handleInvoiceSearch(this.value)"
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-teal-700 outline-none text-slate-800 placeholder-slate-400" />
        </div>
      </div>

      <!-- Invoices Ledger Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th class="py-3 px-4">Invoice #</th>
                <th class="py-3 px-4">Client Account</th>
                <th class="py-3 px-4">Issue Date</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4 text-right">Total (18% GST)</th>
                <th class="py-3 px-4 text-right">Balance Due</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filteredInvoices.length === 0 ? `
                <tr>
                  <td colspan="8" class="py-12 text-center text-slate-400">
                    No invoices match the selected filter.
                  </td>
                </tr>
              ` : filteredInvoices.map(inv => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-semibold text-[#081534]">
                    ${inv.invoiceNumber}
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="font-semibold text-slate-900">${inv.customerName}</div>
                    <div class="text-[11px] text-slate-500 font-mono">${inv.customerEmail}</div>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-slate-600">${inv.invoiceDate || inv.issueDate || '-'}</td>
                  <td class="py-3.5 px-4 font-mono text-slate-600">${inv.dueDate || '-'}</td>
                  <td class="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                    ₹${(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td class="py-3.5 px-4 text-right font-mono font-semibold ${(inv.balanceDue || 0) > 0 ? 'text-amber-700' : 'text-slate-400'}">
                    ₹${(inv.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                      inv.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : inv.status === 'overdue'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : inv.status === 'confirmed'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'bg-slate-100 text-slate-700'
                    }">
                      <span class="w-1.5 h-1.5 rounded-full ${
                        inv.status === 'paid' ? 'bg-emerald-500' : inv.status === 'overdue' ? 'bg-amber-500' : 'bg-sky-500'
                      }"></span>
                      ${inv.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      <button onclick="window.previewInvoicePDF('${inv.invoiceNumber}')" 
                        class="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
                        title="View printable tax invoice">
                        View
                      </button>
                      ${inv.balanceDue > 0 && inv.status !== 'cancelled' ? `
                        <button onclick="window.openRecordPaymentModal('${inv.invoiceNumber}', ${inv.balanceDue})" 
                          class="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors">
                          Pay
                        </button>
                      ` : ''}
                      ${inv.status === 'draft' ? `
                        <button onclick="window.confirmInvoiceAction('${inv.invoiceNumber}')" 
                          class="px-2.5 py-1 rounded bg-[#081534] hover:bg-[#1e2a4a] text-white text-xs font-medium transition-colors">
                          Confirm
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
