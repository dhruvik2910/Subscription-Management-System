// src/components/subscriptions.js - Subscriptions & Quotation Detail Workbench
import { store } from '../store.js';

let selectedSubscriptionId = 'sub-8842';

export function setSelectedSubscription(id) {
  selectedSubscriptionId = id;
}

export function renderSubscriptions() {
  const state = store.getState();
  const sub = state.subscriptions.find(s => s.id === selectedSubscriptionId) || state.subscriptions[0];
  if (!sub) return `<div class="p-8 text-center text-slate-500">No subscriptions found.</div>`;

  const stages = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
  const currentStageIndex = stages.indexOf(sub.status);

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Top Breadcrumb & Subscription Selector -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e2e8f0]">
        <div class="flex items-center gap-2 text-xs text-[#76777f]">
          <span class="hover:text-[#081534] cursor-pointer" onclick="window.appNavigate('revenue-operations')">Subscriptions</span>
          <span class="material-symbols-outlined text-xs">chevron_right</span>
          <span class="font-mono bg-[#dce9ff] px-1.5 py-0.5 rounded text-[#081534] font-semibold">${sub.subscriptionNumber}</span>
          <span class="material-symbols-outlined text-xs">chevron_right</span>
          <span class="text-[#0b1c30] font-medium truncate">${sub.customerName}</span>
        </div>

        <!-- Quick Switcher -->
        <div class="flex items-center gap-2">
          <label class="text-xs text-[#64748b] font-medium">Select Record:</label>
          <select onchange="window.selectSubscriptionRecord(this.value)" 
            class="text-xs font-mono bg-white border border-[#cbd5e1] rounded-lg px-2.5 py-1 text-[#081534] font-medium focus:ring-2 focus:ring-[#006a61] outline-none">
            ${state.subscriptions.map(s => `
              <option value="${s.id}" ${s.id === sub.id ? 'selected' : ''}>
                ${s.subscriptionNumber} - ${s.customerName} (${s.status.toUpperCase()})
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Subscription Header Card & Lifecycle Stepper -->
      <div class="bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        <!-- Identifier & Client Info -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center flex-wrap gap-2.5">
            <h1 class="text-2xl font-bold font-mono text-[#081534] tracking-tight">${sub.subscriptionNumber}</h1>
            
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
              sub.status === 'active' 
                ? 'bg-[#86f2e4]/30 text-[#006f66]' 
                : sub.status === 'closed'
                ? 'bg-[#ffdad6] text-[#93000a]'
                : 'bg-[#eff4ff] text-[#081534]'
            }">
              <span class="w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-[#006a61]' : sub.status === 'closed' ? 'bg-[#ba1a1a]' : 'bg-[#76777f]'}"></span>
              ${sub.status} ${sub.isPaused ? '(PAUSED)' : sub.autoRenew ? '• Auto-Renewing' : ''}
            </span>

            <span class="px-2 py-0.5 rounded bg-[#e5eeff] text-[#081534] text-xs font-mono">
              ${sub.tier || 'Enterprise'}
            </span>
          </div>

          <div class="flex items-center gap-2 text-xs text-[#45464e] flex-wrap">
            <span class="text-[#0b1c30] font-semibold">${sub.customerName}</span>
            <span>•</span>
            <span>${sub.planName}</span>
            <span>•</span>
            <span class="font-mono text-[#76777f]">${sub.crn || 'CIN: U72200MH2021PTC384420'}</span>
          </div>
        </div>

        <!-- Lifecycle Stepper Component -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
          ${stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return `
              <div class="flex items-center gap-2 shrink-0">
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent 
                    ? 'bg-[#1e2a4a] text-white shadow-sm ring-2 ring-[#006a61]/30 font-bold' 
                    : isCompleted 
                    ? 'bg-[#86f2e4]/30 text-[#006f66]' 
                    : 'bg-[#f1f5f9] text-[#76777f]'
                }">
                  ${isCompleted ? '<span class="material-symbols-outlined text-sm font-bold">check_circle</span>' : ''}
                  ${isCurrent ? '<span class="w-2 h-2 rounded-full bg-[#86f2e4] animate-ping"></span>' : ''}
                  <span class="capitalize">${stage}</span>
                </div>
                ${idx < stages.length - 1 ? `
                  <div class="w-4 h-0.5 ${idx < currentStageIndex ? 'bg-[#006a61]' : 'bg-[#cbd5e1]'}"></div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

      </div>

      <!-- Action Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          
          ${currentStageIndex < stages.length - 1 && sub.status !== 'closed' ? `
            <button onclick="window.advanceSubscriptionStage('${sub.id}')" 
              class="inline-flex items-center gap-1.5 bg-[#006a61] hover:bg-[#005049] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all">
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
              <span>Advance to "${stages[currentStageIndex + 1]}"</span>
            </button>
          ` : ''}

          <button onclick="window.createRenewalQuote('${sub.id}')" 
            class="inline-flex items-center gap-1.5 bg-[#1e2a4a] text-white hover:bg-[#081534] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm">
            <span class="material-symbols-outlined text-sm">autorenew</span>
            <span>Create Renewal Quote</span>
          </button>

          <button onclick="window.generateNextInvoiceForSub('${sub.id}')" 
            class="inline-flex items-center gap-1.5 bg-white text-[#0b1c30] hover:bg-[#eff4ff] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border border-[#cbd5e1] shadow-sm">
            <span class="material-symbols-outlined text-sm">receipt_long</span>
            <span>Generate Next Invoice</span>
          </button>

          <button onclick="window.togglePauseSub('${sub.id}')" 
            class="inline-flex items-center gap-1.5 bg-white text-[#0b1c30] hover:bg-[#eff4ff] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border border-[#cbd5e1] shadow-sm">
            <span class="material-symbols-outlined text-sm">${sub.isPaused ? 'play_arrow' : 'pause'}</span>
            <span>${sub.isPaused ? 'Resume Plan' : 'Pause Plan'}</span>
          </button>

          ${sub.status !== 'closed' ? `
            <button onclick="window.closeSubscription('${sub.id}')" 
              class="inline-flex items-center gap-1.5 bg-white text-[#ba1a1a] hover:bg-red-50 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border border-[#ffdad6] shadow-sm">
              <span class="material-symbols-outlined text-sm">cancel</span>
              <span>Cancel / Close</span>
            </button>
          ` : ''}
        </div>

        <div class="flex items-center gap-2">
          <button onclick="window.previewQuotationPrint('${sub.id}')" 
            class="inline-flex items-center gap-1.5 bg-white text-[#081534] hover:bg-[#eff4ff] px-3 py-2 rounded-lg text-xs font-semibold border border-[#cbd5e1] shadow-sm">
            <span class="material-symbols-outlined text-sm">print</span>
            <span>Print / PDF View</span>
          </button>
        </div>
      </div>

      <!-- Line Items & Financial Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Lines Table (8 Cols) -->
        <div class="lg:col-span-8 bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-[#cbd5e1] pb-3">
            <h2 class="text-base font-bold text-[#081534]">Contract Line Items & Brand Variants</h2>
            <span class="text-xs font-mono text-[#64748b]">${sub.items.length} Product Lines</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider font-semibold">
                  <th class="py-2.5 px-3">Product / Service</th>
                  <th class="py-2.5 px-3 text-center">Seats / Qty</th>
                  <th class="py-2.5 px-3 text-right">Unit Price</th>
                  <th class="py-2.5 px-3 text-right">Tax (GST)</th>
                  <th class="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#f1f5f9]">
                ${sub.items.map(item => `
                  <tr class="hover:bg-[#f8f9ff]">
                    <td class="py-3.5 px-3">
                      <div class="font-semibold text-[#081534]">${item.productName}</div>
                      <div class="text-[11px] text-[#006a61] font-mono mt-0.5 flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">sell</span>
                        <span>Variant: <strong>${item.variantName || 'Standard Edition'}</strong></span>
                      </div>
                    </td>
                    <td class="py-3.5 px-3 text-center font-mono font-bold text-[#0b1c30]">
                      ${item.quantity}
                    </td>
                    <td class="py-3.5 px-3 text-right font-mono text-[#45464e]">
                      ₹${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="py-3.5 px-3 text-right font-mono text-[#64748b]">
                      ${item.taxRate}%
                    </td>
                    <td class="py-3.5 px-3 text-right font-mono font-bold text-[#081534]">
                      ₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Totals Breakdown -->
          <div class="border-t border-[#cbd5e1] pt-4 flex flex-col items-end gap-1.5 text-xs font-mono">
            <div class="flex justify-between w-64 text-[#45464e]">
              <span>Subtotal:</span>
              <span>₹${sub.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            ${sub.discountTotal > 0 ? `
              <div class="flex justify-between w-64 text-[#006a61] font-semibold">
                <span>Discount Applied:</span>
                <span>-₹${sub.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div class="flex justify-between w-64 text-[#45464e]">
              <span>Taxes (GST 18%):</span>
              <span>+₹${sub.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="flex justify-between w-64 text-sm font-bold text-[#081534] border-t border-[#cbd5e1] pt-2 mt-1">
              <span>Recurring Total:</span>
              <span class="text-[#006a61]">₹${sub.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- Sidebar: Terms & Contract Details (4 Cols) -->
        <div class="lg:col-span-4 flex flex-col gap-4">
          
          <div class="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <h3 class="text-sm font-bold text-[#081534] mb-3">Billing & Term Schedule</h3>
            
            <div class="space-y-3 text-xs">
              <div class="flex justify-between pb-2 border-b border-[#f1f5f9]">
                <span class="text-[#64748b]">Recurrence</span>
                <span class="font-mono font-semibold text-[#081534] capitalize">${sub.planName.includes('Yearly') ? 'Yearly' : 'Monthly'}</span>
              </div>
              <div class="flex justify-between pb-2 border-b border-[#f1f5f9]">
                <span class="text-[#64748b]">Effective From</span>
                <span class="font-mono text-[#081534]">${sub.startDate}</span>
              </div>
              <div class="flex justify-between pb-2 border-b border-[#f1f5f9]">
                <span class="text-[#64748b]">Expires On</span>
                <span class="font-mono text-[#081534]">${sub.expiryDate}</span>
              </div>
              <div class="flex justify-between pb-2 border-b border-[#f1f5f9]">
                <span class="text-[#64748b]">Next Billing Date</span>
                <span class="font-mono font-semibold text-[#006a61]">${sub.nextBillingDate}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#64748b]">Payment Terms</span>
                <span class="font-mono text-[#081534] font-medium">${sub.paymentTerms}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <h3 class="text-sm font-bold text-[#081534] mb-2">Customer Account Profile</h3>
            <p class="text-xs text-[#0b1c30] font-semibold">${sub.customerName}</p>
            <p class="text-xs text-[#76777f] font-mono mt-0.5">${sub.customerEmail}</p>
            <div class="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
              <span class="text-[#64748b]">Customer Portal:</span>
              <span class="px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] font-mono font-bold">Self-Service Active</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  `;
}
