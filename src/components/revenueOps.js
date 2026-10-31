// src/components/revenueOps.js - Clean, Human Revenue & Billing Dashboard
import { store } from '../store.js';

export function renderRevenueOps() {
  const state = store.getState();
  const activeSubs = state.subscriptions.filter(s => s.status === 'active' && !s.isPaused);
  
  // Real-time calculations in INR (₹)
  const totalActiveSubs = activeSubs.length;
  const mrrInvoiced = state.invoices.reduce((acc, inv) => acc + (inv.status !== 'cancelled' ? inv.totalAmount : 0), 0);
  const totalCollected = state.invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  
  const overdueInvoices = state.invoices.filter(inv => inv.status === 'overdue' && inv.balanceDue > 0);
  const overdueBalance = overdueInvoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Clean Welcome Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Revenue & Billing Overview</h1>
          <p class="text-xs text-slate-500 mt-1">
            Billing Month: October 2024 • Active software subscriptions, automated recurring runs, and cash reconciliation.
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

      <!-- 4 Spacious, Human Metric Cards -->
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
