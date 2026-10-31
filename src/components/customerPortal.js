// src/components/customerPortal.js - Customer Self-Service Portal
import { store } from '../store.js';

export function renderCustomerPortal() {
  const state = store.getState();
  
  // Apex Retail customer data
  const customerEmail = 'aarav@apexretail.in';
  const customerSub = state.subscriptions.find(s => s.customerEmail === customerEmail) || state.subscriptions[1];
  const customerInvoices = state.invoices.filter(i => i.customerEmail === customerEmail);
  const pendingInvoice = customerInvoices.find(i => i.status === 'overdue' || (i.balanceDue > 0 && i.status !== 'cancelled'));

  const addons = customerSub?.addonsEnabled || { analytics: true, support: true };

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Attention Banner (if invoice is pending) -->
      ${pendingInvoice ? `
        <div class="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-[#93000a]">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-xs shrink-0">!</span>
            <div class="text-xs">
              <strong>Pending Invoice:</strong> Invoice <span class="font-mono bg-white/70 px-1.5 py-0.5 rounded font-bold">${pendingInvoice.invoiceNumber}</span> (₹${pendingInvoice.balanceDue.toFixed(2)}) is due. Settle via UPI or Net Banking to keep services uninterrupted.
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button onclick="window.openRecordPaymentModal('${pendingInvoice.invoiceNumber}', ${pendingInvoice.balanceDue})" 
              class="px-4 py-1.5 rounded-lg bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#93000a] transition-colors shadow-sm">
              Pay Now (₹${pendingInvoice.balanceDue.toFixed(2)})
            </button>
          </div>
        </div>
      ` : `
        <div class="bg-[#86f2e4]/20 border border-[#006a61]/20 rounded-xl p-3 shadow-sm flex items-center gap-2.5 text-[#006f66] text-xs">
          <span class="material-symbols-outlined text-base">check_circle</span>
          <span>Your account is in good standing! All subscription invoices are paid up to date.</span>
        </div>
      `}

      <!-- Customer Account Header -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#dce9ff]/40 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-[#eff4ff] text-[#081534] font-bold tracking-wider uppercase">
                CUSTOMER PORTAL
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Subscription
              </span>
              <span class="text-xs font-mono text-[#76777f] bg-[#f8f9ff] px-2 py-0.5 rounded">
                Account ID: #APEX-9821
              </span>
            </div>

            <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Apex Retail Pvt Ltd</h1>
            <p class="text-xs text-[#45464e] flex items-center gap-2 flex-wrap">
              <span>Account Lead: <strong>Aarav Patel</strong> (Head of Operations)</span>
              <span class="text-[#cbd5e1]">•</span>
              <span>CIN: U51909GJ2022PTC118920</span>
            </p>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button onclick="document.getElementById('paymentMethodsSec').scrollIntoView({behavior:'smooth'})" 
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#eff4ff] text-[#081534] text-xs font-semibold hover:bg-[#dce9ff] transition-colors border border-[#cbd5e1]">
              <span class="material-symbols-outlined text-sm">account_balance_wallet</span>
              <span>Payment Methods</span>
            </button>
            <button onclick="window.openCustomerUpgradeModal()" 
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1e2a4a] text-white text-xs font-semibold hover:bg-[#081534] transition-colors shadow-sm">
              <span class="material-symbols-outlined text-sm">upgrade</span>
              <span>Request More Seats</span>
            </button>
          </div>
        </div>

        <!-- Quick Summary Bento Strip -->
        <div class="mt-6 pt-6 border-t border-[#f1f5f9] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#f8f9ff] rounded-xl p-4">
          <div>
            <span class="text-xs text-[#76777f]">Current Plan</span>
            <div class="font-mono text-xl font-bold text-[#081534] mt-0.5">${customerSub?.planName || 'Monthly Business Plan'}</div>
            <span class="text-[11px] text-[#006a61] font-semibold">Billed every month</span>
          </div>

          <div>
            <span class="text-xs text-[#76777f]">Next Renewal Date</span>
            <div class="font-mono text-xl font-bold text-[#081534] mt-0.5">${customerSub?.nextBillingDate || '14 Nov 2024'}</div>
            <span class="text-[11px] text-[#64748b]">Auto-debit scheduled</span>
          </div>

          <div>
            <span class="text-xs text-[#76777f]">Next Billing Amount</span>
            <div class="font-mono text-xl font-bold text-[#006a61] mt-0.5">₹${customerSub?.grandTotal.toFixed(2) || '1,711.00'}</div>
            <span class="text-[11px] text-[#76777f] font-mono">Includes 18% GST</span>
          </div>

          <div>
            <span class="text-xs text-[#76777f]">Preferred Payment</span>
            <div class="font-mono text-xl font-bold text-[#081534] mt-0.5 flex items-center gap-1.5">
              <span>UPI / Net Banking</span>
              <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">AUTO</span>
            </div>
            <span class="text-[11px] text-emerald-700 font-medium">Auto-pay enabled</span>
          </div>
        </div>

      </div>

      <!-- Feature Highlight: Add-ons Customers Switch On and Off (From PDF) -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f1f5f9] pb-3">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-[#081534]">Modular Add-ons (Switch On / Off)</h2>
              <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                From PDF Business Model
              </span>
            </div>
            <p class="text-xs text-[#64748b]">Turn features on or off as your requirements change. Your next invoice updates automatically.</p>
          </div>
          <span class="text-xs font-mono text-[#006a61] font-bold">
            Total Monthly Plan: ₹${customerSub?.grandTotal.toFixed(2)}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- Add-on 1: Analytics & Forecasting -->
          <div class="p-4 rounded-xl border ${addons.analytics ? 'border-[#006a61] bg-[#f8f9ff]' : 'border-[#e2e8f0] bg-slate-50/50'} flex items-start justify-between gap-3 transition-all">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-[#081534]">Analytics & Revenue Forecasting</span>
                <span class="px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${addons.analytics ? 'bg-[#86f2e4]/30 text-[#006f66]' : 'bg-gray-100 text-gray-500'}">
                  ${addons.analytics ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p class="text-[11px] text-[#64748b]">Sales dashboards, cohort retention curves, and financial forecasts.</p>
              <div class="text-xs font-mono font-bold text-[#006a61] pt-1">+₹250.00 / month</div>
            </div>

            <button onclick="window.toggleCustomerAddonAction('${customerSub?.id}', 'analytics')" 
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                addons.analytics 
                  ? 'bg-red-50 text-[#ba1a1a] hover:bg-red-100 border border-[#ffdad6]' 
                  : 'bg-[#006a61] text-white hover:bg-[#005049]'
              }">
              ${addons.analytics ? 'Turn Off' : 'Turn On'}
            </button>
          </div>

          <!-- Add-on 2: 24/7 SLA -->
          <div class="p-4 rounded-xl border ${addons.support ? 'border-[#006a61] bg-[#f8f9ff]' : 'border-[#e2e8f0] bg-slate-50/50'} flex items-start justify-between gap-3 transition-all">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-[#081534]">24/7 Dedicated Support SLA</span>
                <span class="px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${addons.support ? 'bg-[#86f2e4]/30 text-[#006f66]' : 'bg-gray-100 text-gray-500'}">
                  ${addons.support ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p class="text-[11px] text-[#64748b]">15-minute response SLA with dedicated technical account manager.</p>
              <div class="text-xs font-mono font-bold text-[#006a61] pt-1">+₹200.00 / month</div>
            </div>

            <button onclick="window.toggleCustomerAddonAction('${customerSub?.id}', 'support')" 
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                addons.support 
                  ? 'bg-red-50 text-[#ba1a1a] hover:bg-red-100 border border-[#ffdad6]' 
                  : 'bg-[#006a61] text-white hover:bg-[#005049]'
              }">
              ${addons.support ? 'Turn Off' : 'Turn On'}
            </button>
          </div>

        </div>
      </div>

      <!-- Invoices History & Statement Downloads -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-bold text-[#081534]">Invoice Statements & Receipts</h2>
            <p class="text-xs text-[#64748b]">Download official GST tax invoices directly anytime</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#cbd5e1] text-[#76777f] uppercase font-semibold">
                <th class="py-2.5 px-3">Invoice #</th>
                <th class="py-2.5 px-3">Billing Date</th>
                <th class="py-2.5 px-3">Due Date</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3 text-right">Amount (INR)</th>
                <th class="py-2.5 px-3 text-right">Actions</th>
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
                    ₹${inv.totalAmount.toFixed(2)}
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="inline-flex items-center gap-1.5 justify-end">
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

      <!-- Payment Methods Section -->
      <div id="paymentMethodsSec" class="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-bold text-[#081534]">Saved Payment Methods</h2>
            <p class="text-xs text-[#64748b]">Direct debit and UPI mandates for automatic recurring billing</p>
          </div>
          <button onclick="alert('In production, this opens Razorpay / Stripe UPI Mandate authorization sheet.')" 
            class="px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#081534] text-xs font-semibold border border-[#cbd5e1] hover:bg-[#dce9ff] transition-all">
            + Add UPI / Bank Account
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl border-2 border-[#006a61] bg-[#f8f9ff] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-[#006a61]">account_balance</span>
              <div>
                <div class="font-mono text-sm font-bold text-[#081534]">HDFC Corporate Net Banking •• 4912</div>
                <div class="text-[11px] text-[#64748b]">e-NACH Auto-Debit Active</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">DEFAULT</span>
          </div>

          <div class="p-4 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-2xl text-[#76777f]">qr_code_2</span>
              <div>
                <div class="font-mono text-sm font-bold text-[#081534]">apexretail@okaxis (UPI Autopay)</div>
                <div class="text-[11px] text-[#64748b]">Verified UPI Recurring Mandate</div>
              </div>
            </div>
            <span class="text-xs text-[#76777f] font-mono">Secondary</span>
          </div>
        </div>
      </div>

    </div>
  `;
}
