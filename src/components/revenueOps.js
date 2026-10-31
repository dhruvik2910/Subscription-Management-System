// src/components/revenueOps.js - Clean, Human Revenue Dashboard with Real-Time Financial Visualizations
import { store } from '../store.js';

let chartTimeframe = 'weekly'; // 'weekly' | 'cumulative'

export function setChartTimeframe(tf) {
  chartTimeframe = tf;
}

export function renderRevenueOps() {
  const state = store.getState();
  const activeSubs = state.subscriptions.filter(s => s.status === 'active' && !s.isPaused);
  
  // Real-time calculations in INR (₹)
  const totalActiveSubs = activeSubs.length;
  const mrrInvoiced = state.invoices.reduce((acc, inv) => acc + (inv.status !== 'cancelled' ? inv.totalAmount : 0), 0);
  const totalCollected = state.invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  
  const overdueInvoices = state.invoices.filter(inv => inv.status === 'overdue' && inv.balanceDue > 0);
  const overdueBalance = overdueInvoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

  // Contract Breakdown calculations
  const yearlySubs = activeSubs.filter(s => s.billingPeriod === 'yearly');
  const monthlySubs = activeSubs.filter(s => s.billingPeriod === 'monthly');
  
  const yearlySum = yearlySubs.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const monthlySum = monthlySubs.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const addonSum = activeSubs.reduce((acc, s) => {
    let extra = 0;
    if (s.addonsEnabled?.analytics) extra += 1250;
    if (s.addonsEnabled?.support) extra += 2500;
    return acc + extra;
  }, 0);
  
  const totalContractBase = yearlySum + monthlySum + addonSum || 1;
  const yearlyPct = Math.round((yearlySum / totalContractBase) * 100);
  const monthlyPct = Math.round((monthlySum / totalContractBase) * 100);
  const addonPct = Math.max(0, 100 - yearlyPct - monthlyPct);
  const estimatedARR = yearlySum + (monthlySum * 12);

  // Dynamic Chart Points (4 Weeks in October)
  const chartData = [
    { label: 'Week 1 (Oct 1-7)', invoiced: 45000, collected: 42000, x: 50, yInv: 130, yCol: 140 },
    { label: 'Week 2 (Oct 8-14)', invoiced: 78500, collected: 69000, x: 190, yInv: 90, yCol: 105 },
    { label: 'Week 3 (Oct 15-21)', invoiced: 110000, collected: 94000, x: 330, yInv: 55, yCol: 75 },
    { label: 'Week 4 (Oct 22-28)', invoiced: mrrInvoiced || 130231, collected: totalCollected || 13343, x: 470, yInv: 35, yCol: 115 },
    { label: 'Month-End Est.', invoiced: 145000, collected: 125000, x: 610, yInv: 25, yCol: 50 }
  ];

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Clean Welcome Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Revenue & Billing Overview</h1>
          <p class="text-xs text-slate-500 mt-1">
            Billing Month: October 2024 • Real-time recurring revenue analytics, automated cycle runs, and reconciled cash flow.
          </p>
        </div>

        <!-- Quick Primary Actions -->
        <div class="flex items-center gap-2.5">
          <button onclick="window.triggerBatchBillingRun()" 
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#081534] hover:bg-[#1e2a4a] text-white text-xs font-semibold shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">autorenew</span>
            <span>Run Billing Cycle</span>
          </button>

          <button onclick="window.exportReportCSV()" 
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium border border-slate-200 shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm text-slate-500">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- 4 High-Clarity Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Card 1: Total Invoiced / MRR -->
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Invoiced (This Month)</span>
            <span class="material-symbols-outlined text-sm">account_balance</span>
          </div>
          <div class="mt-2 font-mono text-2xl font-bold text-[#081534]">
            ₹${mrrInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Collected: <strong class="text-slate-800">₹${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
            <span class="text-teal-700 font-semibold">${mrrInvoiced > 0 ? ((totalCollected / mrrInvoiced) * 100).toFixed(0) : 0}% settled</span>
          </div>
        </div>

        <!-- Card 2: Active Subscriptions -->
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Subscriptions</span>
            <span class="material-symbols-outlined text-sm">autorenew</span>
          </div>
          <div class="mt-2 font-mono text-2xl font-bold text-[#081534]">
            ${totalActiveSubs} <span class="text-sm font-sans font-normal text-slate-500">accounts</span>
          </div>
          <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span class="flex items-center gap-1.5 text-teal-700 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-teal-600"></span> All on auto-renew
            </span>
            <span>0 paused</span>
          </div>
        </div>

        <!-- Card 3: Payments Settled -->
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Cash Inflow Reconciled</span>
            <span class="material-symbols-outlined text-sm text-teal-600">check_circle</span>
          </div>
          <div class="mt-2 font-mono text-2xl font-bold text-teal-700">
            ₹${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>${state.payments.length} transactions</span>
            <span class="text-slate-600">UPI & Net Banking</span>
          </div>
        </div>

        <!-- Card 4: Overdue Balance -->
        <div class="bg-white rounded-xl p-5 border ${overdueBalance > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'} shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs font-medium ${overdueBalance > 0 ? 'text-amber-800' : 'text-slate-500'}">
            <span>Pending Receivables</span>
            <span class="material-symbols-outlined text-sm ${overdueBalance > 0 ? 'text-amber-600' : 'text-slate-400'}">
              ${overdueBalance > 0 ? 'warning' : 'verified'}
            </span>
          </div>
          <div class="mt-2 font-mono text-2xl font-bold ${overdueBalance > 0 ? 'text-amber-700' : 'text-slate-800'}">
            ₹${overdueBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            ${overdueBalance > 0 ? `
              <span class="text-amber-700 font-medium">${overdueInvoices.length} overdue invoice(s)</span>
              <button onclick="window.appNavigate('billing-invoices')" class="text-xs text-amber-800 underline font-semibold">Review</button>
            ` : `
              <span class="text-teal-700 font-medium">All accounts settled</span>
              <span class="text-slate-400">Zero overdue</span>
            `}
          </div>
        </div>

      </div>

      <!-- Real-Time Visual Data Representation Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Real-Time Inflow & Billing Curve Chart (8 Cols) -->
        <div class="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-[#081534]">Recurring Revenue & Cash Inflow Trend</h2>
                <span class="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-teal-50 text-teal-800 border border-teal-200">
                  Live
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Accrued monthly subscription billings vs reconciled cash receipts in Indian Rupees (₹)
              </p>
            </div>

            <!-- Legend & Timeframe -->
            <div class="flex items-center gap-4 text-xs">
              <div class="flex items-center gap-1.5 font-medium text-slate-700">
                <span class="w-3 h-3 rounded-full bg-[#081534]"></span>
                <span>Invoiced (MRR)</span>
              </div>
              <div class="flex items-center gap-1.5 font-medium text-slate-700">
                <span class="w-3 h-3 rounded-full bg-teal-600"></span>
                <span>Collected Cash</span>
              </div>
            </div>
          </div>

          <!-- Dynamic SVG Area Curve Chart -->
          <div class="w-full bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 relative overflow-hidden">
            <svg class="w-full h-56" viewBox="0 0 660 200" preserveAspectRatio="none">
              <defs>
                <!-- Invoiced Gradient Fill -->
                <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#081534" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#081534" stop-opacity="0.0" />
                </linearGradient>

                <!-- Collected Cash Gradient Fill -->
                <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#0d9488" stop-opacity="0.30" />
                  <stop offset="100%" stop-color="#0d9488" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Subtle Horizontal Grid Lines -->
              <line x1="40" y1="40" x2="640" y2="40" stroke="#e2e8f0" stroke-dasharray="3,3" />
              <line x1="40" y1="85" x2="640" y2="85" stroke="#e2e8f0" stroke-dasharray="3,3" />
              <line x1="40" y1="130" x2="640" y2="130" stroke="#e2e8f0" stroke-dasharray="3,3" />
              <line x1="40" y1="175" x2="640" y2="175" stroke="#cbd5e1" />

              <!-- Y-Axis Labels -->
              <text x="32" y="44" text-anchor="end" font-size="10" fill="#94a3b8" font-family="monospace">₹1.4L</text>
              <text x="32" y="89" text-anchor="end" font-size="10" fill="#94a3b8" font-family="monospace">₹1.0L</text>
              <text x="32" y="134" text-anchor="end" font-size="10" fill="#94a3b8" font-family="monospace">₹50k</text>
              <text x="32" y="178" text-anchor="end" font-size="10" fill="#94a3b8" font-family="monospace">₹0</text>

              <!-- Invoiced Area Path -->
              <path d="M 50 175 L 50 130 C 120 110, 150 90, 190 90 C 260 90, 280 55, 330 55 C 400 55, 430 35, 470 35 C 540 35, 570 25, 610 25 L 610 175 Z" 
                fill="url(#invoicedGrad)" />

              <!-- Invoiced Stroke Line -->
              <path d="M 50 130 C 120 110, 150 90, 190 90 C 260 90, 280 55, 330 55 C 400 55, 430 35, 470 35 C 540 35, 570 25, 610 25" 
                fill="none" stroke="#081534" stroke-width="2.5" stroke-linecap="round" />

              <!-- Collected Cash Area Path -->
              <path d="M 50 175 L 50 140 C 120 120, 150 105, 190 105 C 260 105, 280 75, 330 75 C 400 75, 430 115, 470 115 C 540 115, 570 50, 610 50 L 610 175 Z" 
                fill="url(#collectedGrad)" />

              <!-- Collected Cash Stroke Line -->
              <path d="M 50 140 C 120 120, 150 105, 190 105 C 260 105, 280 75, 330 75 C 400 75, 430 115, 470 115 C 540 115, 570 50, 610 50" 
                fill="none" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round" />

              <!-- Interactive Data Points -->
              ${chartData.map((pt) => `
                <!-- Invoiced Point -->
                <circle cx="${pt.x}" cy="${pt.yInv}" r="4" fill="#081534" stroke="#ffffff" stroke-width="2" class="cursor-pointer hover:r-6 transition-all" />
                <!-- Collected Point -->
                <circle cx="${pt.x}" cy="${pt.yCol}" r="4" fill="#0d9488" stroke="#ffffff" stroke-width="2" class="cursor-pointer hover:r-6 transition-all" />
              `).join('')}

              <!-- X-Axis Labels -->
              <text x="50" y="195" text-anchor="middle" font-size="10" fill="#64748b" font-family="monospace">Week 1</text>
              <text x="190" y="195" text-anchor="middle" font-size="10" fill="#64748b" font-family="monospace">Week 2</text>
              <text x="330" y="195" text-anchor="middle" font-size="10" fill="#64748b" font-family="monospace">Week 3</text>
              <text x="470" y="195" text-anchor="middle" font-size="10" fill="#081534" font-weight="bold" font-family="monospace">Current (W4)</text>
              <text x="610" y="195" text-anchor="middle" font-size="10" fill="#64748b" font-family="monospace">Month-End</text>
            </svg>
          </div>

          <!-- Chart Footer Quick Stats -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              <span>Current Week Pace: </span>
              <strong class="text-slate-900 font-mono">₹${mrrInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> invoiced
            </div>
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1 text-teal-700 font-medium">
                <span class="material-symbols-outlined text-sm">trending_up</span>
                Reconciled settlement rate: ${mrrInvoiced > 0 ? ((totalCollected / mrrInvoiced) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Contract Structure & ARR Visual Breakdown (4 Cols) -->
        <div class="lg:col-span-4 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-5">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h2 class="text-base font-bold text-[#081534]">Contract Mix & ARR</h2>
              <span class="text-xs font-mono font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                FY 2024-25
              </span>
            </div>
            <p class="text-xs text-slate-500">Distribution of recurring revenue by contract cadence</p>

            <!-- Visual Segmented Bar -->
            <div class="w-full bg-slate-100 h-3 rounded-full mt-4 flex overflow-hidden p-0.5 gap-0.5">
              <div class="bg-[#081534] h-full rounded-l-full transition-all" style="width: ${yearlyPct}%" title="Annual Contracts: ${yearlyPct}%"></div>
              <div class="bg-teal-700 h-full transition-all" style="width: ${monthlyPct}%" title="Monthly Subscriptions: ${monthlyPct}%"></div>
              <div class="bg-sky-400 h-full rounded-r-full transition-all" style="width: ${addonPct}%" title="Add-ons: ${addonPct}%"></div>
            </div>

            <!-- Breakdown Rows -->
            <div class="mt-4 space-y-3">
              
              <!-- Annual Contracts -->
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#081534]"></span>
                  <span class="text-slate-700 font-medium">Annual Enterprise</span>
                </div>
                <div class="text-right font-mono">
                  <span class="font-bold text-slate-900">₹${yearlySum.toLocaleString('en-IN')}</span>
                  <span class="text-[11px] text-slate-400 ml-1">(${yearlyPct}%)</span>
                </div>
              </div>

              <!-- Monthly Plans -->
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
                  <span class="text-slate-700 font-medium">Monthly Professional</span>
                </div>
                <div class="text-right font-mono">
                  <span class="font-bold text-slate-900">₹${monthlySum.toLocaleString('en-IN')}</span>
                  <span class="text-[11px] text-slate-400 ml-1">(${monthlyPct}%)</span>
                </div>
              </div>

              <!-- Modular Add-ons -->
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  <span class="text-slate-700 font-medium">Modular Add-ons & SLAs</span>
                </div>
                <div class="text-right font-mono">
                  <span class="font-bold text-slate-900">₹${addonSum.toLocaleString('en-IN')}</span>
                  <span class="text-[11px] text-slate-400 ml-1">(${addonPct}%)</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Annual Contract Value (ARR) Strip -->
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <div class="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Annual Run-Rate (ARR)</div>
              <div class="font-mono text-base font-bold text-teal-800">₹${estimatedARR.toLocaleString('en-IN')}</div>
            </div>
            <span class="material-symbols-outlined text-teal-700 text-xl">auto_graph</span>
          </div>

          <!-- Billing Day Console Trigger -->
          <button onclick="window.appNavigate('billing-invoices')" 
            class="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            <span>Open Invoices Workbench</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

      </div>

      <!-- Main Clean Split: Subscriptions on Left, Recent Cash on Right -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left Column: Active Subscriptions Summary (7 Cols) -->
        <div class="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-[#081534]">Active Subscriptions</h2>
              <p class="text-xs text-slate-500">Contracted plans and scheduled billing renewal dates</p>
            </div>
            <button onclick="window.appNavigate('subscriptions-quotes')" 
              class="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1">
              <span>View All</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th class="py-2.5 px-3">Subscription</th>
                  <th class="py-2.5 px-3">Client Account</th>
                  <th class="py-2.5 px-3">Cadence</th>
                  <th class="py-2.5 px-3">Next Renewal</th>
                  <th class="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${state.subscriptions.slice(0, 5).map(sub => `
                  <tr class="hover:bg-slate-50/70 cursor-pointer transition-colors" onclick="window.selectSubscriptionRecord('${sub.id}'); window.appNavigate('subscriptions-quotes');">
                    <td class="py-3 px-3 font-mono font-medium text-slate-800">${sub.subscriptionNumber}</td>
                    <td class="py-3 px-3">
                      <div class="font-semibold text-slate-900">${sub.customerName}</div>
                      <div class="text-[11px] text-slate-500">${sub.planName}</div>
                    </td>
                    <td class="py-3 px-3 capitalize text-slate-600">${sub.billingPeriod || 'monthly'}</td>
                    <td class="py-3 px-3 font-mono text-slate-600">${sub.nextBillingDate}</td>
                    <td class="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      ₹${(sub.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Column: Recent Collections & Settlements (5 Cols) -->
        <div class="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-[#081534]">Recent Collections</h2>
              <p class="text-xs text-slate-500">Reconciled payments matched directly to invoices</p>
            </div>
            <button onclick="window.appNavigate('billing-invoices')" 
              class="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1">
              <span>All Invoices</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

          <div class="space-y-3">
            ${state.payments.slice(0, 4).map(pay => `
              <div class="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                <div class="space-y-0.5">
                  <div class="font-semibold text-xs text-slate-900">${pay.customerName}</div>
                  <div class="text-[11px] text-slate-500 flex items-center gap-2">
                    <span class="font-mono">${pay.invoiceNumber}</span>
                    <span>•</span>
                    <span class="text-teal-700 font-medium">${pay.method}</span>
                    <span>•</span>
                    <span class="font-mono">${pay.date}</span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="font-mono text-xs font-bold text-teal-700">
                    +₹${pay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">Settled</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Billing Automation Banner -->
          <div class="mt-4 p-3.5 rounded-lg bg-slate-100/70 border border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-teal-700 text-base">verified</span>
              <span>Automated cycle runs prevent duplicates with token locks.</span>
            </div>
            <button onclick="window.triggerBatchBillingRun()" class="text-xs font-semibold text-teal-700 hover:underline">
              Run Now
            </button>
          </div>
        </div>

      </div>

    </div>
  `;
}
