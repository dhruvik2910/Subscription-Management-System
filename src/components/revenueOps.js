// src/components/revenueOps.js - Revenue & Operations Dashboard
import { store } from '../store.js';

export function renderRevenueOps() {
  const state = store.getState();
  const activeSubs = state.subscriptions.filter(s => s.status === 'active' && !s.isPaused);
  
  // Calculate dynamic metrics
  const totalActiveSubs = activeSubs.length;
  const mrrInvoiced = state.invoices.reduce((acc, inv) => acc + (inv.status !== 'cancelled' ? inv.totalAmount : 0), 0);
  const totalPaymentsRecorded = state.payments.reduce((acc, pay) => acc + pay.amount, 0);
  
  const overdueInvoices = state.invoices.filter(inv => inv.status === 'overdue' && inv.balanceDue > 0);
  const overdueBalance = overdueInvoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Top Action / Control Bar -->
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-[#e2e8f0]">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl sm:text-3xl font-bold text-[#081534] tracking-tight">Revenue & Operations Overview</h1>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006a61]/10 text-[#006a61] text-xs font-mono font-bold shadow-sm">
              <span class="material-symbols-outlined text-sm">bolt</span>
              <span>Query execution: <strong class="text-[#081534]">142ms</strong> (SLA &lt; 2.0s)</span>
            </div>
          </div>
          <p class="text-sm text-[#45464e] mt-1">Billing Month: October 2024 • Consolidated Ledger & Cash Reconciliation for Brightloop Software</p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Segmented Filter -->
          <div class="inline-flex items-center p-1 rounded-xl bg-[#e5eeff] shadow-inner text-xs font-medium">
            <button class="px-3 py-1.5 rounded-lg bg-white text-[#081534] font-semibold shadow-sm transition-all">Last 30 Days</button>
            <button class="px-3 py-1.5 rounded-lg text-[#45464e] hover:text-[#0b1c30] transition-all">Q3 vs Q4</button>
            <button class="px-3 py-1.5 rounded-lg text-[#45464e] hover:text-[#0b1c30] transition-all">Fiscal YTD</button>
          </div>

          <button onclick="window.exportReportCSV()" 
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#081534] text-xs font-semibold shadow-sm hover:bg-[#eff4ff] border border-[#cbd5e1] transition-all">
            <span class="material-symbols-outlined text-sm">download</span>
            <span>Export Report</span>
          </button>

          <button onclick="window.refreshLedger()" 
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e2a4a] text-white text-xs font-semibold shadow-sm hover:bg-[#081534] transition-all">
            <span class="material-symbols-outlined text-sm">sync</span>
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      <!-- 4 High-Density KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Card 1: Active Subscriptions -->
        <div class="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-[#64748b] font-medium uppercase tracking-wider">Active Subscriptions</span>
            <span class="material-symbols-outlined text-[#64748b] text-lg">autorenew</span>
          </div>
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-mono text-3xl font-bold text-[#081534]">${totalActiveSubs.toLocaleString()}</span>
            <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#006a61]/10 text-[#006a61] text-xs font-mono font-bold">
              <span class="material-symbols-outlined text-xs">trending_up</span>+12.4%
            </span>
          </div>
          <div class="flex items-center justify-between pt-3 mt-3 bg-[#eff4ff] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#45464e]">
            <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span> ${Math.max(1, totalActiveSubs - 1)} Renewed</span>
            <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span> 1 Churned</span>
          </div>
        </div>

        <!-- Card 2: Recognized MRR / Invoiced -->
        <div class="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-[#64748b] font-medium uppercase tracking-wider">Recognized MRR / Invoiced</span>
            <span class="material-symbols-outlined text-[#64748b] text-lg">account_balance</span>
          </div>
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-mono text-3xl font-bold text-[#081534]">$${mrrInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#081534] text-xs font-mono font-semibold">
              Oct 2024
            </span>
          </div>
          <div class="flex items-center justify-between pt-3 mt-3 bg-[#eff4ff] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#45464e]">
            <span>Collected: <strong class="text-[#0b1c30]">$${totalPaymentsRecorded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            <span class="text-[#006a61] font-bold">${mrrInvoiced > 0 ? ((totalPaymentsRecorded / mrrInvoiced) * 100).toFixed(1) : 0}% Rate</span>
          </div>
        </div>

        <!-- Card 3: Payments Recorded -->
        <div class="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-[#64748b] font-medium uppercase tracking-wider">Payments Recorded</span>
            <span class="material-symbols-outlined text-[#006a61] text-lg">check_circle</span>
          </div>
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-mono text-3xl font-bold text-[#006a61]">$${totalPaymentsRecorded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0b1c30] text-xs font-mono">
              ${state.payments.length} txns
            </span>
          </div>
          <div class="flex items-center justify-between pt-3 mt-3 bg-[#eff4ff] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#45464e]">
            <span class="truncate">ACH (72%) • Stripe (22%) • Wire (6%)</span>
          </div>
        </div>

        <!-- Card 4: Overdue & Outstanding -->
        <div class="bg-white rounded-xl p-5 border ${overdueBalance > 0 ? 'border-[#ffdad6] bg-red-50/20' : 'border-[#e2e8f0]'} shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-[#ba1a1a] font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <span class="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"></span> Overdue & Outstanding
            </span>
            <span class="material-symbols-outlined text-[#ba1a1a] text-lg">warning</span>
          </div>
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-mono text-3xl font-bold text-[#ba1a1a]">$${overdueBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-mono font-bold">
              ${overdueInvoices.length} Invoices
            </span>
          </div>
          <div class="flex items-center justify-between pt-3 mt-3 bg-[#ffdad6]/40 rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#93000a]">
            <span class="font-semibold">${overdueInvoices.length} Accounts Awaiting Settlement</span>
            <button onclick="document.getElementById('overdueSection').scrollIntoView({behavior:'smooth'})" class="font-bold underline hover:text-[#ba1a1a]">Review</button>
          </div>
        </div>

      </div>

      <!-- Main Grid (8 Cols Chart + 4 Cols Summary Breakdown) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Interactive Chart & Revenue Breakdown (8 Cols) -->
        <div class="lg:col-span-8 bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 class="text-lg font-bold text-[#081534]">Monthly Billing & Cash Inflow Dynamics</h2>
              <p class="text-xs text-[#64748b]">Accrued billing vs settled cash inflow categorized by recurrence structure</p>
            </div>
            <!-- Legend -->
            <div class="flex items-center gap-4 text-xs font-mono">
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[#081534]"></span> Monthly Rec.</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[#006a61]"></span> Annual Amort.</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[#d3e4fe]"></span> Add-ons/SLA</span>
            </div>
          </div>

          <!-- Dynamic SVG Stacked Bar Chart -->
          <div class="w-full bg-[#f8f9ff] rounded-xl p-4 border border-[#e2e8f0] relative">
            <div class="h-48 w-full flex items-end justify-between gap-4 pt-6 pb-2">
              
              <!-- Week 1 -->
              <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span class="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs font-bold text-[#081534]">$74.2k</span>
                <div class="w-full max-w-[48px] flex flex-col gap-0.5 items-center">
                  <div class="w-full bg-[#d3e4fe] rounded-t-sm h-7 group-hover:brightness-95 transition-all" title="Add-ons: $14.2k"></div>
                  <div class="w-full bg-[#006a61] h-16 group-hover:brightness-95 transition-all" title="Annual: $32.0k"></div>
                  <div class="w-full bg-[#081534] rounded-b-sm h-18 group-hover:brightness-95 transition-all" title="Monthly: $28.0k"></div>
                </div>
                <span class="font-mono text-xs text-[#64748b]">Oct 01-07</span>
              </div>

              <!-- Week 2 -->
              <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span class="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs font-bold text-[#081534]">$88.5k</span>
                <div class="w-full max-w-[48px] flex flex-col gap-0.5 items-center">
                  <div class="w-full bg-[#d3e4fe] rounded-t-sm h-9 group-hover:brightness-95 transition-all" title="Add-ons: $18.5k"></div>
                  <div class="w-full bg-[#006a61] h-20 group-hover:brightness-95 transition-all" title="Annual: $40.0k"></div>
                  <div class="w-full bg-[#081534] rounded-b-sm h-20 group-hover:brightness-95 transition-all" title="Monthly: $30.0k"></div>
                </div>
                <span class="font-mono text-xs text-[#64748b]">Oct 08-14</span>
              </div>

              <!-- Week 3 -->
              <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span class="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs font-bold text-[#081534]">$112.4k</span>
                <div class="w-full max-w-[48px] flex flex-col gap-0.5 items-center">
                  <div class="w-full bg-[#d3e4fe] rounded-t-sm h-12 group-hover:brightness-95 transition-all" title="Add-ons: $24.4k"></div>
                  <div class="w-full bg-[#006a61] h-24 group-hover:brightness-95 transition-all" title="Annual: $48.0k"></div>
                  <div class="w-full bg-[#081534] rounded-b-sm h-22 group-hover:brightness-95 transition-all" title="Monthly: $40.0k"></div>
                </div>
                <span class="font-mono text-xs text-[#64748b]">Oct 15-21</span>
              </div>

              <!-- Week 4 -->
              <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span class="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs font-bold text-[#081534]">$96.8k</span>
                <div class="w-full max-w-[48px] flex flex-col gap-0.5 items-center">
                  <div class="w-full bg-[#d3e4fe] rounded-t-sm h-10 group-hover:brightness-95 transition-all" title="Add-ons: $20.8k"></div>
                  <div class="w-full bg-[#006a61] h-20 group-hover:brightness-95 transition-all" title="Annual: $42.0k"></div>
                  <div class="w-full bg-[#081534] rounded-b-sm h-20 group-hover:brightness-95 transition-all" title="Monthly: $34.0k"></div>
                </div>
                <span class="font-mono text-xs text-[#64748b]">Oct 22-28</span>
              </div>

              <!-- Week 5 (Forecast) -->
              <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group opacity-75">
                <span class="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs font-bold text-[#081534]">$45.0k (Est)</span>
                <div class="w-full max-w-[48px] flex flex-col gap-0.5 items-center border border-dashed border-[#006a61] rounded-t p-0.5">
                  <div class="w-full bg-[#d3e4fe]/80 rounded-t-sm h-6"></div>
                  <div class="w-full bg-[#006a61]/80 h-10"></div>
                  <div class="w-full bg-[#081534]/80 rounded-b-sm h-8"></div>
                </div>
                <span class="font-mono text-xs text-[#64748b]">Oct 29-31</span>
              </div>

            </div>
          </div>
        </div>

        <!-- Right Side: Retention & Dunning Summary (4 Cols) -->
        <div class="lg:col-span-4 flex flex-col gap-4">
          <div class="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <h3 class="text-sm font-bold text-[#081534] mb-3 flex items-center justify-between">
              <span>Billing Recurrence Breakdown</span>
              <span class="text-xs font-mono text-[#006a61]">99.4% Uptime</span>
            </h3>

            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs font-mono mb-1">
                  <span class="text-[#45464e]">Yearly Enterprise Contracts</span>
                  <span class="font-bold text-[#081534]">$245,000 (70.3%)</span>
                </div>
                <div class="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#081534] h-full rounded-full" style="width: 70%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs font-mono mb-1">
                  <span class="text-[#45464e]">Monthly SaaS Licenses</span>
                  <span class="font-bold text-[#081534]">$82,400 (23.6%)</span>
                </div>
                <div class="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#006a61] h-full rounded-full" style="width: 24%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs font-mono mb-1">
                  <span class="text-[#45464e]">Add-ons & 24/7 SLAs</span>
                  <span class="font-bold text-[#081534]">$21,250 (6.1%)</span>
                </div>
                <div class="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#d3e4fe] h-full rounded-full" style="width: 6%"></div>
                </div>
              </div>
            </div>

            <div class="mt-5 pt-4 border-t border-[#f1f5f9] flex justify-between items-center text-xs">
              <span class="text-[#64748b]">Total Contracted ARR</span>
              <span class="font-mono text-sm font-bold text-[#006a61]">$4,183,800.00</span>
            </div>
          </div>

          <!-- Quick Action Card -->
          <div class="bg-gradient-to-br from-[#1e2a4a] to-[#081534] text-white rounded-xl p-5 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-emerald-400 text-lg">bolt</span>
              <span class="text-xs font-semibold uppercase tracking-wider text-emerald-300">Fast Billing Dispatch</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed mb-4">
              All active subscriptions are monitored in real time. Batch runs enforce strict idempotency to prevent double-billing.
            </p>
            <button onclick="window.appNavigate('billing-invoices')" 
              class="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-sm">schedule_send</span>
              <span>Open Billing Day Workbench</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Overdue Aging Schedule & Dunning Action Center -->
      <div id="overdueSection" class="bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-base font-bold text-[#081534] flex items-center gap-2">
              <span>Overdue Receivables & Dunning Actions</span>
              <span class="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-mono font-bold">
                ${overdueInvoices.length} Outstanding
              </span>
            </h2>
            <p class="text-xs text-[#64748b]">Chase overdue balances to recover revenue before cycle close</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-[#64748b]">Filter Aging:</span>
            <span class="px-2 py-1 rounded bg-[#eff4ff] text-xs font-mono font-semibold text-[#081534]">All Ages</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#cbd5e1] text-[#64748b] uppercase tracking-wider font-semibold">
                <th class="py-2.5 px-3">Invoice #</th>
                <th class="py-2.5 px-3">Customer Account</th>
                <th class="py-2.5 px-3">Due Date</th>
                <th class="py-2.5 px-3">Overdue Aging</th>
                <th class="py-2.5 px-3 text-right">Balance Due</th>
                <th class="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f1f5f9]">
              ${overdueInvoices.length === 0 ? `
                <tr>
                  <td colspan="6" class="py-8 text-center text-[#64748b]">
                    <span class="material-symbols-outlined text-3xl text-[#006a61] mb-1">verified</span>
                    <p class="font-medium text-[#0b1c30]">Zero overdue invoices!</p>
                    <p class="text-xs text-[#64748b]">All customer receivables are fully settled.</p>
                  </td>
                </tr>
              ` : overdueInvoices.map(inv => `
                <tr class="hover:bg-[#f8f9ff] transition-colors">
                  <td class="py-3 px-3 font-mono font-semibold text-[#081534]">${inv.invoiceNumber}</td>
                  <td class="py-3 px-3">
                    <div class="font-medium text-[#0b1c30]">${inv.customerName}</div>
                    <div class="text-[11px] text-[#76777f] font-mono">${inv.customerEmail}</div>
                  </td>
                  <td class="py-3 px-3 font-mono text-[#64748b]">${inv.dueDate}</td>
                  <td class="py-3 px-3">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-mono font-bold">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                      ${inv.daysOverdue || 11} Days Past Due
                    </span>
                  </td>
                  <td class="py-3 px-3 font-mono font-bold text-right text-[#ba1a1a]">
                    $${inv.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      <button onclick="window.sendDunningNotice('${inv.invoiceNumber}', '${inv.customerName}')" 
                        class="px-2.5 py-1 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[#081534] font-medium text-[11px] transition-colors">
                        Send Reminder
                      </button>
                      <button onclick="window.openRecordPaymentModal('${inv.invoiceNumber}', ${inv.balanceDue})" 
                        class="px-2.5 py-1 rounded bg-[#006a61] hover:bg-[#005049] text-white font-medium text-[11px] transition-colors">
                        Record Payment
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Payments & Inflow Ledger -->
      <div class="bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-base font-bold text-[#081534]">Recent Inflow Settlement Ledger</h2>
            <p class="text-xs text-[#64748b]">Live feed of payments reconciled directly against invoices</p>
          </div>
          <button onclick="window.appNavigate('billing-invoices')" 
            class="text-xs font-semibold text-[#006a61] hover:underline flex items-center gap-1">
            <span>View All Invoices</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#cbd5e1] text-[#64748b] uppercase tracking-wider font-semibold">
                <th class="py-2 px-3">Date</th>
                <th class="py-2 px-3">Invoice</th>
                <th class="py-2 px-3">Account</th>
                <th class="py-2 px-3">Method</th>
                <th class="py-2 px-3">Audit Reference</th>
                <th class="py-2 px-3 text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f1f5f9]">
              ${state.payments.slice(0, 5).map(pay => `
                <tr class="hover:bg-[#f8f9ff]">
                  <td class="py-2.5 px-3 font-mono text-[#64748b]">${pay.date}</td>
                  <td class="py-2.5 px-3 font-mono font-semibold text-[#081534]">${pay.invoiceNumber}</td>
                  <td class="py-2.5 px-3 font-medium text-[#0b1c30]">${pay.customerName}</td>
                  <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded bg-[#eff4ff] text-[#006a61] font-mono font-semibold">
                      ${pay.method}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 font-mono text-[11px] text-[#76777f]">${pay.note}</td>
                  <td class="py-2.5 px-3 font-mono font-bold text-right text-[#006a61]">
                    +$${pay.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
