// src/components/customerPortal.js - Customer Self-Service Portal
import { store } from '../store.js';

export function renderCustomerPortal() {
  const state = store.getState();
  
  // Apex Retail customer data
  const customerEmail = 'alex.chen@apexretail.com';
  const customerSub = state.subscriptions.find(s => s.customerEmail === customerEmail) || state.subscriptions[1];
  const customerInvoices = state.invoices.filter(i => i.customerEmail === customerEmail);
  const pendingInvoice = customerInvoices.find(i => i.status === 'overdue' || (i.balanceDue > 0 && i.status !== 'cancelled'));

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Overdue Banner (if outstanding) -->
      ${pendingInvoice ? `
        <div class="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-[#93000a]">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-xs shrink-0">!</span>
            <div class="text-xs">
              <strong>Action Required:</strong> Invoice <span class="font-mono bg-white/70 px-1.5 py-0.5 rounded font-bold">${pendingInvoice.invoiceNumber}</span> ($${pendingInvoice.balanceDue.toFixed(2)}) is awaiting settlement.
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button onclick="window.openRecordPaymentModal('${pendingInvoice.invoiceNumber}', ${pendingInvoice.balanceDue})" 
              class="px-4 py-1.5 rounded-lg bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#93000a] transition-colors shadow-sm">
              Pay Now
            </button>
          </div>
        </div>
      ` : `
        <div class="bg-[#86f2e4]/20 border border-[#006a61]/20 rounded-xl p-3 shadow-sm flex items-center gap-2.5 text-[#006f66] text-xs">
          <span class="material-symbols-outlined text-base">check_circle</span>
          <span>Your account is in excellent standing! All invoices are fully reconciled.</span>
        </div>
      `}

      <!-- Customer Account & Organization Header Panel -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#dce9ff]/40 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-[#eff4ff] text-[#081534] font-bold tracking-wider uppercase">
                CLIENT PORTAL
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active • In Good Standing
              </span>
              <span class="text-xs font-mono text-[#76777f] bg-[#f8f9ff] px-2 py-0.5 rounded">
                Org ID: #CUST-98214
              </span>
            </div>

            <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Apex Retail Inc</h1>
            <p class="text-xs text-[#45464e] flex items-center gap-2 flex-wrap">
              <span>Primary Billing Account: <strong>Alex Chen</strong> (VP Operations)</span>
              <span class="text-[#cbd5e1]">•</span>
              <span>Enterprise SLA: Tier-1 Production</span>
            </p>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button onclick="document.getElementById('paymentMethodsSec').scrollIntoView({behavior:'smooth'})" 
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#eff4ff] text-[#081534] text-xs font-semibold hover:bg-[#dce9ff] transition-colors border border-[#cbd5e1]">
              <span class="material-symbols-outlined text-sm">credit_card</span>
              <span>Payment Methods</span>
            </button>
            <button onclick="window.openCustomerUpgradeModal()" 
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1e2a4a] text-white text-xs font-semibold hover:bg-[#081534] transition-colors shadow-sm">
              <span class="material-symbols-outlined text-sm">upgrade</span>
              <span>Request Plan Upgrade</span>
            </button>
          </div>
        </div>

        <!-- Quick Metrics Bento Strip -->
        <div class="mt-6 pt-6 border-t border-[#f1f5f9] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#f8f9ff] rounded-xl p-4">
          <div>
            <span class="text-xs text-[#76777f]">Subscriptions In Service</span>
            <div class="font-mono text-xl font-bold text-[#081534] mt-0.5">1 Active Plan</div>
            <span class="text-[11px] text-[#006a61] font-semibold">Starter Monthly Tier</span>
          </div>

          <div>
            <span class="text-xs text-[#76777f]">Next Scheduled Renewal</span>
            <div class="font-mono text-xl font-bold text-[#081534] mt-0.5">${customerSub?.nextBillingDate || 'Nov 14, 2024'}</div>
            <span class="text-[11px] text-[#64748b]">Auto-pay will process</span>
          </div>

          <div>
            <span class="text-xs text-[#76777f]">Primary Payment Flow</span>
            <div class="font-mono text-xl font-bold text-[#081534] mt-0.5 flex items-center gap-1.5">
              <span>Visa •• 4242</span>
              <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">AUTO</span>
            </div>
            <span class="text-[11px] text-emerald-700 font-medium">Active & Verified</span>
          </div>

          <div>
            <span class="text-xs text-[#76777f]">Contract Term Progress</span>
            <div class="font-mono text-xl font-bold text-[#081534] mt-0.5">Day 14 of 30</div>
            <div class="w-full bg-[#eff4ff] h-1.5 rounded-full overflow-hidden mt-1">
              <div class="bg-[#006a61] h-full" style="width: 46%"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- Active Plan Details & Self-Service Management -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div>
            <h2 class="text-base font-bold text-[#081534]">Active Subscription Overview</h2>
            <p class="text-xs text-[#64748b]">Self-service control over your active licenses and add-ons</p>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] font-mono text-xs font-bold">
            ${customerSub?.status.toUpperCase() || 'ACTIVE'}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-[#f8f9ff] p-4 rounded-xl border border-[#e2e8f0]">
            <h3 class="text-xs font-bold text-[#081534] uppercase tracking-wider mb-2">Allocated License Entitlements</h3>
            <ul class="space-y-2 text-xs">
              <li class="flex items-center justify-between">
                <span>Brightloop ERP Suite (Standard Multi-Tenant Cloud)</span>
                <span class="font-mono font-bold text-[#081534]">1 Seat ($1,250/mo)</span>
              </li>
              <li class="flex items-center justify-between">
                <span>24/7 Dedicated Support SLA (Tier 1 Critical)</span>
                <span class="font-mono font-bold text-[#081534]">Included ($200/mo)</span>
              </li>
            </ul>
          </div>

          <div class="bg-[#f8f9ff] p-4 rounded-xl border border-[#e2e8f0] flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-bold text-[#081534] uppercase tracking-wider mb-1">Contract Directives</h3>
              <p class="text-xs text-[#45464e]">Terms: Due upon receipt. Automatic debit on invoice creation date.</p>
            </div>
            <div class="flex items-center gap-2 pt-3 border-t border-[#cbd5e1] mt-3">
              <button onclick="window.customerTogglePause('${customerSub?.id}')" 
                class="px-3 py-1.5 rounded-lg bg-white text-[#081534] text-xs font-semibold border border-[#cbd5e1] hover:bg-[#eff4ff] transition-all">
                ${customerSub?.isPaused ? 'Resume Plan' : 'Pause Plan'}
              </button>
              <button onclick="window.openCustomerUpgradeModal()" 
                class="px-3 py-1.5 rounded-lg bg-[#006a61] text-white text-xs font-semibold hover:bg-[#005049] transition-all">
                Add Seats (+5 Seats)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoices History & Statement Downloads -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-bold text-[#081534]">Billing History & Statements</h2>
            <p class="text-xs text-[#64748b]">Instant access to official PDF tax invoices and receipts without emailing support</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#cbd5e1] text-[#76777f] uppercase font-semibold">
                <th class="py-2.5 px-3">Invoice #</th>
                <th class="py-2.5 px-3">Billing Period</th>
                <th class="py-2.5 px-3">Due Date</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3 text-right">Amount</th>
                <th class="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f1f5f9]">
              ${customerInvoices.map(inv => `
                <tr class="hover:bg-[#f8f9ff]">
                  <td class="py-3 px-3 font-mono font-bold text-[#081534]">${inv.invoiceNumber}</td>
                  <td class="py-3 px-3 font-mono text-[#64748b]">${inv.issueDate}</td>
                  <td class="py-3 px-3 font-mono text-[#64748b]">${inv.dueDate}</td>
                  <td class="py-3 px-3">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                      inv.status === 'paid' 
                        ? 'bg-[#86f2e4]/30 text-[#006f66]' 
                        : 'bg-[#ffdad6] text-[#93000a]'
                    }">
                      <span class="w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-[#006a61]' : 'bg-[#ba1a1a]'}"></span>
                      ${inv.status}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-mono font-bold text-right text-[#081534]">
                    $${inv.totalAmount.toFixed(2)}
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      ${inv.balanceDue > 0 ? `
                        <button onclick="window.openRecordPaymentModal('${inv.invoiceNumber}', ${inv.balanceDue})" 
                          class="px-2.5 py-1 rounded bg-[#ba1a1a] text-white hover:bg-[#93000a] text-[11px] font-bold">
                          Pay Now
                        </button>
                      ` : ''}
                      <button onclick="window.previewInvoicePrint('${inv.invoiceNumber}')" 
                        class="px-2.5 py-1 rounded bg-white border border-[#cbd5e1] text-[#081534] hover:bg-[#eff4ff] text-[11px] font-medium flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">download</span>
                        <span>PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment Methods on File Section -->
      <div id="paymentMethodsSec" class="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-bold text-[#081534]">Payment Methods On File</h2>
            <p class="text-xs text-[#64748b]">Manage credit cards and direct debit authorizations for recurring charges</p>
          </div>
          <button onclick="alert('In production, this opens the PCI-compliant Stripe Elements card capture sheet.')" 
            class="px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#081534] text-xs font-semibold border border-[#cbd5e1] hover:bg-[#dce9ff] transition-all">
            + Add Payment Method
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl border-2 border-[#006a61] bg-[#f8f9ff] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-[#006a61]">credit_card</span>
              <div>
                <div class="font-mono text-sm font-bold text-[#081534]">Visa ending in 4242</div>
                <div class="text-[11px] text-[#64748b]">Expires 08/2027 • Primary Default</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">DEFAULT</span>
          </div>

          <div class="p-4 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-[#76777f]">account_balance</span>
              <div>
                <div class="font-mono text-sm font-bold text-[#081534]">Chase Corporate ACH •• 8912</div>
                <div class="text-[11px] text-[#64748b]">Verified Direct Debit Backup</div>
              </div>
            </div>
            <span class="text-xs text-[#76777f] font-mono">Backup</span>
          </div>
        </div>
      </div>

    </div>
  `;
}
