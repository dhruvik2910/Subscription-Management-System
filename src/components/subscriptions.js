// src/components/subscriptions.js - Clean, Human Subscriptions & Quotation Workbench
import { store } from '../store.js';

let selectedSubscriptionId = 'sub-8842';
let filterTab = 'all'; // 'all' | 'active' | 'quotation' | 'closed'

export function setSelectedSubscription(id) {
  selectedSubscriptionId = id;
}

export function setSubFilter(filter) {
  filterTab = filter;
}

export function renderSubscriptions() {
  const state = store.getState();
  const sub = state.subscriptions.find(s => s.id === selectedSubscriptionId) || state.subscriptions[0];
  
  const filteredSubs = state.subscriptions.filter(s => {
    if (filterTab === 'all') return true;
    return s.status === filterTab;
  });

  const stages = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
  const currentStageIndex = sub ? stages.indexOf(sub.status) : 0;

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Top Header & Primary Action -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Subscriptions & Quotations</h1>
          <p class="text-xs text-slate-500 mt-1">
            Manage customer recurring contracts, quotes, lifecycle transitions, and renewals.
          </p>
        </div>

        <button onclick="window.openNewQuoteModal()" 
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#081534] hover:bg-[#1e2a4a] text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto">
          <span class="material-symbols-outlined text-sm">add</span>
          <span>New Quotation</span>
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-1 border-b border-slate-200 text-xs font-medium">
        <button onclick="window.setSubFilterTab('all')" 
          class="pb-2.5 px-3 border-b-2 transition-colors ${filterTab === 'all' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          All (${state.subscriptions.length})
        </button>
        <button onclick="window.setSubFilterTab('active')" 
          class="pb-2.5 px-3 border-b-2 transition-colors ${filterTab === 'active' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Active (${state.subscriptions.filter(s => s.status === 'active').length})
        </button>
        <button onclick="window.setSubFilterTab('quotation')" 
          class="pb-2.5 px-3 border-b-2 transition-colors ${filterTab === 'quotation' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Quotations (${state.subscriptions.filter(s => s.status === 'quotation').length})
        </button>
        <button onclick="window.setSubFilterTab('closed')" 
          class="pb-2.5 px-3 border-b-2 transition-colors ${filterTab === 'closed' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Closed (${state.subscriptions.filter(s => s.status === 'closed').length})
        </button>
      </div>

      <!-- Main Layout: Table of Subscriptions -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th class="py-3 px-4">Subscription #</th>
                <th class="py-3 px-4">Customer Account</th>
                <th class="py-3 px-4">Plan / Cadence</th>
                <th class="py-3 px-4">Next Renewal</th>
                <th class="py-3 px-4 text-right">Amount (₹)</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filteredSubs.map(s => {
                const isSelected = sub && sub.id === s.id;
                return `
                  <tr class="hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? 'bg-slate-50 font-medium' : ''}" 
                    onclick="window.selectSubscriptionRecord('${s.id}')">
                    <td class="py-3.5 px-4 font-mono font-semibold text-[#081534]">
                      ${s.subscriptionNumber || s.subscription_number}
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="font-semibold text-slate-900">${s.customerName || s.customer_name}</div>
                      <div class="text-[11px] text-slate-500 font-mono">${s.customerEmail || s.customer_email}</div>
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="text-slate-800">${s.planName || s.plan_name}</div>
                      <div class="text-[11px] text-slate-500 capitalize">${s.billingPeriod || s.billing_period || 'monthly'}</div>
                    </td>
                    <td class="py-3.5 px-4 font-mono text-slate-600">
                      ${s.nextBillingDate || s.next_billing_date || '-'}
                    </td>
                    <td class="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹${((s.totalAmount !== undefined ? s.totalAmount : (s.total_amount || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        s.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : s.status === 'closed'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }">
                        <span class="w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : s.status === 'closed' ? 'bg-rose-500' : 'bg-slate-400'}"></span>
                        ${s.status} ${(s.isPaused || s.is_paused) ? '(Paused)' : ''}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <button onclick="event.stopPropagation(); window.selectSubscriptionRecord('${s.id}')" 
                        class="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors">
                        Details
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Selected Subscription Detail View -->
      ${sub ? `
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          
          <!-- Stepper & Quick Actions -->
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-3">
                <span class="font-mono text-lg font-bold text-[#081534]">${sub.subscriptionNumber || sub.subscription_number}</span>
                <span class="text-xs text-slate-500">•</span>
                <span class="font-semibold text-slate-800 text-sm">${sub.customerName || sub.customer_name}</span>
                <span class="text-xs font-mono text-slate-400">(${sub.customerGstin || sub.customer_gstin || 'GSTIN on file'})</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                ${sub.planName || sub.plan_name} • Billed ${sub.billingPeriod || sub.billing_period || 'monthly'} • Renewal date: <span class="font-mono font-medium text-slate-800">${sub.nextBillingDate || sub.next_billing_date || '-'}</span>
              </p>
            </div>

            <!-- Lifecycle Stage Buttons -->
            <div class="flex flex-wrap items-center gap-2">
              ${sub.status !== 'closed' ? `
                <button onclick="window.advanceSubscriptionStage('${sub.id}')" 
                  class="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-medium transition-colors flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">step_into</span>
                  <span>Advance Stage (${stages[Math.min(stages.length - 1, currentStageIndex + 1)]})</span>
                </button>
                <button onclick="window.togglePauseSub('${sub.id}')" 
                  class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors">
                  ${sub.isPaused ? 'Resume Contract' : 'Pause Contract'}
                </button>
                <button onclick="window.generateNextInvoiceForSub('${sub.id}')" 
                  class="px-3 py-1.5 rounded-lg bg-[#081534] hover:bg-[#1e2a4a] text-white text-xs font-semibold shadow-sm transition-all">
                  Generate Invoice
                </button>
              ` : `
                <button onclick="window.createRenewalQuote('${sub.id}')" 
                  class="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all">
                  Create Renewal Quote
                </button>
              `}
            </div>
          </div>

          <!-- Lifecycle Stage Tracker -->
          <div>
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Lifecycle Stage</div>
            <div class="flex items-center gap-2 overflow-x-auto pb-1">
              ${stages.map((stg, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return `
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                      isCurrent 
                        ? 'bg-[#081534] text-white font-semibold shadow-sm' 
                        : isPassed 
                        ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                        : 'bg-slate-100 text-slate-400'
                    }">
                      ${isPassed ? '✓ ' : ''}${stg}
                    </span>
                    ${idx < stages.length - 1 ? '<span class="text-slate-300">→</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Line Items Table -->
          <div>
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Contract Line Items</div>
            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                    <th class="py-2.5 px-3">Product Description</th>
                    <th class="py-2.5 px-3">Edition / Variant</th>
                    <th class="py-2.5 px-3 text-center">Qty</th>
                    <th class="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th class="py-2.5 px-3 text-right">Subtotal (₹)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${(sub.lines || sub.items || []).map(line => `
                    <tr>
                      <td class="py-2.5 px-3 text-slate-900 font-medium">${line.product_name || line.productName || 'Software Service'}</td>
                      <td class="py-2.5 px-3 text-slate-600">${line.variant_name || line.variantName || 'Standard'}</td>
                      <td class="py-2.5 px-3 text-center font-mono">${line.quantity || line.qty || 1}</td>
                      <td class="py-2.5 px-3 text-right font-mono">₹${(line.unit_price !== undefined ? line.unit_price : (line.unitPrice || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td class="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">₹${(line.subtotal !== undefined ? line.subtotal : (line.total || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="bg-slate-50/70 border-t border-slate-200 font-semibold">
                    <td colspan="4" class="py-2.5 px-3 text-right text-slate-600">Recurring Total:</td>
                    <td class="py-2.5 px-3 text-right font-mono text-slate-900 font-bold">
                      ₹${((sub.totalAmount !== undefined ? sub.totalAmount : (sub.total_amount || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      ` : ''}

    </div>
  `;
}
