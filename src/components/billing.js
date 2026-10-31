// src/components/billing.js - Automated Billing Day Console & Invoices Workbench
import { store } from '../store.js';

let invoiceFilter = 'all'; // 'all' | 'draft' | 'confirmed' | 'paid' | 'overdue'
let invoiceSearch = '';

export function setInvoiceFilter(filter) {
  invoiceFilter = filter;
}

export function setInvoiceSearch(term) {
  invoiceSearch = term;
}

export function renderBilling() {
  const state = store.getState();
  const latestRun = state.billingRuns[0] || {
    id: 'BR-2024-10-01',
    date: 'Oct 01, 2024 00:01 AM UTC',
    subscriptionsProcessed: 412,
    duplicatesPrevented: 0,
    skippedCycles: 0,
    executionTimeMs: 184
  };

  const filteredInvoices = state.invoices.filter(inv => {
    const matchesFilter = invoiceFilter === 'all' || inv.status === invoiceFilter;
    const matchesSearch = !invoiceSearch || 
      inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalBilled = state.invoices.reduce((acc, inv) => acc + (inv.status !== 'cancelled' ? inv.totalAmount : 0), 0);
  const totalCollected = state.invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Top Operational Banner & Automated Run Status -->
      <div class="relative overflow-hidden rounded-xl bg-[#eff4ff] border border-[#dce9ff] shadow-sm">
        <div class="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#86f2e4]/15 blur-3xl pointer-events-none"></div>
        <div class="p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-lg bg-[#006a61] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-2xl">task_alt</span>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-base font-semibold text-[#0b1c30]">Billing Run #${latestRun.id} Complete</span>
                <span class="px-2 py-0.5 rounded text-[#006f66] bg-[#86f2e4]/30 text-xs font-mono font-semibold">${latestRun.date}</span>
                <span class="px-2 py-0.5 rounded bg-[#dce9ff] text-[#006a61] text-[10px] font-mono uppercase tracking-wider font-bold">Guaranteed Idempotency</span>
              </div>
              <p class="text-xs text-[#45464e] mt-1">
                <span class="font-semibold text-[#0b1c30]">${latestRun.subscriptionsProcessed} active subscriptions processed</span> automatically from contract terms. 
                <span class="text-[#006a61] font-semibold">${latestRun.duplicatesPrevented} duplicates</span>, <span class="text-[#006a61] font-semibold">${latestRun.skippedCycles} skipped</span>. Regional taxes computed instantaneously via Brightloop Rules Engine.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 w-full xl:w-auto shrink-0 justify-end">
            <div class="hidden sm:flex flex-col text-right">
              <span class="text-[10px] text-[#76777f] uppercase tracking-wider font-semibold">Engine Throughput</span>
              <span class="text-xs font-mono text-[#0b1c30] font-semibold">${latestRun.executionTimeMs}ms execution SLA</span>
            </div>
            <button onclick="window.triggerBatchBillingRun()" 
              class="inline-flex items-center gap-2 bg-[#081534] hover:bg-[#1e2a4a] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-md transition-all group">
              <span class="material-symbols-outlined text-base transition-transform group-hover:rotate-180">autorenew</span>
              <span>Run Billing Day Cycle (Auto-Batch)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Header & Real-time Metrics Bento Strip -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div class="flex items-center gap-1.5 mb-1 text-xs font-mono text-[#006a61] font-semibold uppercase tracking-wider">
            <span>Recurring Ledger Workbench</span>
            <span class="text-[#cbd5e1]">•</span>
            <span>Zero Double-Billing Engine</span>
          </div>
          <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Automated Invoices & Billing Operations</h1>
          <p class="text-xs text-[#64748b]">Idempotent recurring invoices generated automatically from active contracts</p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="window.exportLedgerCSV()" 
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-[#081534] text-xs font-semibold border border-[#cbd5e1] hover:bg-[#eff4ff] shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">download</span>
            <span>Export Invoices (CSV)</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Bento -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm">
          <span class="text-xs text-[#76777f] font-medium uppercase">Total Invoiced (Cycle)</span>
          <div class="font-mono text-2xl font-bold text-[#081534] mt-1">$${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div class="w-full bg-[#eff4ff] h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div class="bg-[#006a61] h-full" style="width: ${totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0}%"></div>
          </div>
          <div class="flex justify-between text-[11px] font-mono text-[#64748b] mt-1.5">
            <span>Collected: $${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
            <span class="text-[#006a61] font-bold">${totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(0) : 0}% settled</span>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm">
          <span class="text-xs text-[#76777f] font-medium uppercase">Automated Precision</span>
          <div class="font-mono text-2xl font-bold text-[#006a61] mt-1">100.0%</div>
          <div class="text-[11px] text-[#64748b] mt-3 flex items-center justify-between">
            <span>Manual Errors Prevented:</span>
            <span class="font-mono font-bold text-[#081534]">0 Skipped / 0 Dups</span>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm">
          <span class="text-xs text-[#76777f] font-medium uppercase">Active Invoices</span>
          <div class="font-mono text-2xl font-bold text-[#081534] mt-1">${state.invoices.length}</div>
          <div class="text-[11px] text-[#64748b] mt-3 flex items-center justify-between">
            <span>Drafts Awaiting Review:</span>
            <span class="font-mono font-bold text-[#081534]">${state.invoices.filter(i => i.status === 'draft').length}</span>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm">
          <span class="text-xs text-[#76777f] font-medium uppercase">Overdue Receivables</span>
          <div class="font-mono text-2xl font-bold text-[#ba1a1a] mt-1">${state.invoices.filter(i => i.status === 'overdue').length}</div>
          <div class="text-[11px] text-[#ba1a1a] mt-3 font-semibold flex items-center justify-between">
            <span>Dunning Sequence Active:</span>
            <span>Immediate Settle</span>
          </div>
        </div>
      </div>

      <!-- Invoices Workbench Table -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        
        <!-- Table Filter & Search Controls -->
        <div class="p-4 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f8f9ff]">
          <div class="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            ${['all', 'draft', 'confirmed', 'paid', 'overdue'].map(f => `
              <button onclick="window.filterInvoices('${f}')" 
                class="px-3 py-1.5 rounded-lg transition-all capitalize ${
                  invoiceFilter === f 
                    ? 'bg-[#1e2a4a] text-white shadow-sm' 
                    : 'bg-white text-[#45464e] hover:bg-[#eff4ff] border border-[#cbd5e1]'
                }">
                ${f} (${f === 'all' ? state.invoices.length : state.invoices.filter(i => i.status === f).length})
              </button>
            `).join('')}
          </div>

          <div class="relative w-full md:w-64">
            <span class="material-symbols-outlined absolute left-2.5 top-2 text-[#76777f] text-sm">search</span>
            <input type="text" placeholder="Search by invoice # or client..." 
              value="${invoiceSearch}"
              oninput="window.searchInvoices(this.value)"
              class="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#cbd5e1] focus:ring-2 focus:ring-[#006a61] outline-none" />
          </div>
        </div>

        <!-- Invoices List -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#cbd5e1] text-[#64748b] uppercase tracking-wider font-semibold bg-white">
                <th class="py-3 px-3">Invoice #</th>
                <th class="py-3 px-3">Customer Account</th>
                <th class="py-3 px-3">Issue Date</th>
                <th class="py-3 px-3">Due Date</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3 text-right">Total Amount</th>
                <th class="py-3 px-3 text-right">Balance Due</th>
                <th class="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f1f5f9]">
              ${filteredInvoices.length === 0 ? `
                <tr>
                  <td colspan="8" class="py-8 text-center text-[#64748b]">
                    No invoices match your selected filter criteria.
                  </td>
                </tr>
              ` : filteredInvoices.map(inv => `
                <tr class="hover:bg-[#f8f9ff] transition-colors">
                  <td class="py-3.5 px-3 font-mono font-bold text-[#081534]">${inv.invoiceNumber}</td>
                  <td class="py-3.5 px-3">
                    <div class="font-medium text-[#0b1c30]">${inv.customerName}</div>
                    <div class="text-[11px] text-[#76777f] font-mono">${inv.customerEmail}</div>
                  </td>
                  <td class="py-3.5 px-3 font-mono text-[#64748b]">${inv.issueDate}</td>
                  <td class="py-3.5 px-3 font-mono text-[#64748b]">${inv.dueDate}</td>
                  <td class="py-3.5 px-3">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                      inv.status === 'paid' 
                        ? 'bg-[#86f2e4]/30 text-[#006f66]' 
                        : inv.status === 'overdue'
                        ? 'bg-[#ffdad6] text-[#93000a]'
                        : inv.status === 'confirmed'
                        ? 'bg-[#dce9ff] text-[#081534]'
                        : 'bg-slate-100 text-slate-700'
                    }">
                      <span class="w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-[#006a61]' : inv.status === 'overdue' ? 'bg-[#ba1a1a]' : 'bg-[#081534]'}"></span>
                      ${inv.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-3 font-mono font-bold text-right text-[#081534]">
                    $${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td class="py-3.5 px-3 font-mono font-bold text-right ${inv.balanceDue > 0 ? 'text-[#ba1a1a]' : 'text-[#006a61]'}">
                    $${inv.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td class="py-3.5 px-3 text-right">
                    <div class="inline-flex items-center gap-1.5 justify-end">
                      
                      ${inv.status === 'draft' ? `
                        <button onclick="window.confirmDraftInvoice('${inv.invoiceNumber}')" 
                          class="px-2.5 py-1 rounded bg-[#006a61] text-white hover:bg-[#005049] text-[11px] font-semibold transition-colors">
                          Confirm
                        </button>
                      ` : ''}

                      ${inv.balanceDue > 0 ? `
                        <button onclick="window.openRecordPaymentModal('${inv.invoiceNumber}', ${inv.balanceDue})" 
                          class="px-2.5 py-1 rounded bg-[#081534] text-white hover:bg-[#1e2a4a] text-[11px] font-semibold transition-colors">
                          Record Pay
                        </button>
                      ` : ''}

                      <button onclick="window.previewInvoicePrint('${inv.invoiceNumber}')" 
                        class="p-1 rounded text-[#76777f] hover:bg-[#e5eeff] hover:text-[#081534] transition-colors" 
                        title="Print / PDF Invoice">
                        <span class="material-symbols-outlined text-base">print</span>
                      </button>

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
