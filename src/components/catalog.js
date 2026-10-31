// src/components/catalog.js - Product Catalog, Plans, Brand Variants & Discount Rules
import { store } from '../store.js';

let activeCatalogTab = 'variants'; // 'variants' | 'plans' | 'discounts' | 'taxes'

export function setCatalogTab(tab) {
  activeCatalogTab = tab;
}

export function renderCatalog() {
  const state = store.getState();
  const isAdmin = state.currentRole === 'admin';

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Top Header Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#e2e8f0]">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] font-mono text-[#76777f] uppercase tracking-wider">Catalog & Pricing</span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-xs font-mono font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span>
              ${isAdmin ? 'Admin Mode (Full Access)' : 'Staff Mode (View Only)'}
            </span>
          </div>
          <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Products, Billing Plans & Discount Rules</h1>
          <p class="text-xs text-[#45464e] mt-0.5 max-w-3xl">
            Configure software products, brand edition price adjustments (e.g. Odoo brand +₹560), recurring cadences, and discount codes.
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="bg-white p-3 rounded-xl border border-[#e2e8f0] shadow-sm min-w-[110px]">
            <span class="text-[10px] text-[#76777f] uppercase tracking-wider font-semibold">Products</span>
            <div class="flex items-baseline gap-1 mt-0.5 font-mono">
              <span class="text-xl font-bold text-[#081534]">${state.products.length}</span>
              <span class="text-xs text-[#006a61] font-semibold">Active</span>
            </div>
          </div>
          <div class="bg-white p-3 rounded-xl border border-[#e2e8f0] shadow-sm min-w-[110px]">
            <span class="text-[10px] text-[#76777f] uppercase tracking-wider font-semibold">Billing Plans</span>
            <div class="flex items-baseline gap-1 mt-0.5 font-mono">
              <span class="text-xl font-bold text-[#081534]">${state.plans.length}</span>
              <span class="text-xs text-[#006a61] font-semibold">Active</span>
            </div>
          </div>
          <div class="bg-white p-3 rounded-xl border border-[#e2e8f0] shadow-sm min-w-[110px]">
            <span class="text-[10px] text-[#76777f] uppercase tracking-wider font-semibold">Discount Rules</span>
            <div class="flex items-baseline gap-1 mt-0.5 font-mono">
              <span class="text-xl font-bold text-[#081534]">${state.discountRules.length}</span>
              <span class="text-xs text-[#006a61] font-semibold">Rules</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="bg-[#f8f9ff] p-1.5 rounded-xl border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button onclick="window.switchCatalogTab('variants')" 
            class="px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeCatalogTab === 'variants'
                ? 'bg-[#1e2a4a] text-white shadow-sm'
                : 'text-[#45464e] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
            }">
            <span class="material-symbols-outlined text-base">widgets</span>
            <span>Products & Brand Variants</span>
          </button>

          <button onclick="window.switchCatalogTab('plans')" 
            class="px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeCatalogTab === 'plans'
                ? 'bg-[#1e2a4a] text-white shadow-sm'
                : 'text-[#45464e] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
            }">
            <span class="material-symbols-outlined text-base">cached</span>
            <span>Recurring Plans (Daily, Weekly, Monthly, Yearly)</span>
          </button>

          <button onclick="window.switchCatalogTab('discounts')" 
            class="px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeCatalogTab === 'discounts'
                ? 'bg-[#1e2a4a] text-white shadow-sm'
                : 'text-[#45464e] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
            }">
            <span class="material-symbols-outlined text-base">percent</span>
            <span>Discount Rules</span>
          </button>

          <button onclick="window.switchCatalogTab('taxes')" 
            class="px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeCatalogTab === 'taxes'
                ? 'bg-[#1e2a4a] text-white shadow-sm'
                : 'text-[#45464e] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
            }">
            <span class="material-symbols-outlined text-base">account_balance</span>
            <span>Tax Engine (GST 18%)</span>
          </button>
        </div>

        <div class="hidden sm:flex items-center gap-2 text-xs font-mono text-[#64748b] pr-2">
          <span>Currency: INR (₹)</span>
          <span class="w-2 h-2 rounded-full bg-[#006a61]"></span>
        </div>
      </div>

      <!-- Tab Content Area -->
      ${activeCatalogTab === 'variants' ? renderProductsAndVariants(state, isAdmin) : ''}
      ${activeCatalogTab === 'plans' ? renderPlansView(state, isAdmin) : ''}
      ${activeCatalogTab === 'discounts' ? renderDiscountsView(state, isAdmin) : ''}
      ${activeCatalogTab === 'taxes' ? renderTaxesView(state, isAdmin) : ''}

    </div>
  `;
}

function renderProductsAndVariants(state, isAdmin) {
  return `
    <div class="flex flex-col gap-6">
      
      <!-- Action Bar -->
      <div class="flex justify-between items-center">
        <h2 class="text-base font-bold text-[#081534]">Products & Configured Brand Variants</h2>
        ${isAdmin ? `
          <button onclick="window.openAddVariantModal()" 
            class="inline-flex items-center gap-1.5 bg-[#006a61] hover:bg-[#005049] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">add</span>
            <span>Add Brand Variant</span>
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 gap-6">
        ${state.products.map(prod => `
          <div class="bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
            
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-[#1e2a4a] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  <span class="material-symbols-outlined">dataset</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-bold text-[#081534]">${prod.name}</h3>
                    <span class="px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-xs font-mono font-semibold">${prod.category}</span>
                    <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono">${prod.type}</span>
                  </div>
                  <p class="text-xs text-[#64748b] mt-0.5 font-mono">SKU: ${prod.sku} • ${prod.notes}</p>
                </div>
              </div>

              <!-- Price breakdown strip in Rupees -->
              <div class="flex items-center gap-4 bg-[#f8f9ff] px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-mono shrink-0">
                <div>
                  <span class="text-[#76777f] text-[10px] block uppercase">Base Price</span>
                  <span class="font-bold text-[#081534] text-sm">₹${prod.salesPrice.toFixed(2)}</span>
                </div>
                <div class="w-px h-6 bg-[#cbd5e1]"></div>
                <div>
                  <span class="text-[#76777f] text-[10px] block uppercase">Cost Price</span>
                  <span class="text-[#45464e] text-sm">₹${prod.costPrice.toFixed(2)}</span>
                </div>
                <div class="w-px h-6 bg-[#cbd5e1]"></div>
                <div>
                  <span class="text-[#76777f] text-[10px] block uppercase">Gross Margin</span>
                  <span class="font-bold text-[#006a61] text-sm">${(((prod.salesPrice - prod.costPrice) / prod.salesPrice) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <!-- Brand Variants Table -->
            <div class="mt-2 border-t border-[#f1f5f9] pt-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-[#081534] uppercase tracking-wider">Brand Edition Variants</span>
                <span class="text-[11px] text-[#64748b] font-mono">${prod.variants?.length || 0} variants configured</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="border-b border-[#cbd5e1] text-[#76777f] uppercase font-semibold">
                      <th class="py-2 px-3">Variant</th>
                      <th class="py-2 px-3">Price Adjustment</th>
                      <th class="py-2 px-3">Effective Price per Unit</th>
                      <th class="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#f1f5f9]">
                    ${(prod.variants || []).map(v => `
                      <tr class="hover:bg-[#f8f9ff]">
                        <td class="py-2.5 px-3">
                          <span class="font-semibold text-[#081534]">${v.name}</span>
                          ${v.name.includes('Odoo') ? `
                            <span class="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Odoo Challenge Spec (+₹560)
                            </span>
                          ` : ''}
                        </td>
                        <td class="py-2.5 px-3 font-mono ${v.priceModifier > 0 ? 'text-[#006a61] font-bold' : 'text-[#76777f]'}">
                          ${v.priceModifier > 0 ? `+₹${v.priceModifier.toFixed(2)}` : '₹0.00 (Base Price)'}
                        </td>
                        <td class="py-2.5 px-3 font-mono font-bold text-[#081534]">
                          ₹${(prod.salesPrice + v.priceModifier).toFixed(2)}
                        </td>
                        <td class="py-2.5 px-3 text-right">
                          <span class="px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] font-mono text-[11px] font-bold">Active</span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        `).join('')}
      </div>

    </div>
  `;
}

function renderPlansView(state, isAdmin) {
  return `
    <div class="flex flex-col gap-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-base font-bold text-[#081534]">Subscription Plans (Daily, Weekly, Monthly, Yearly)</h2>
          <p class="text-xs text-[#64748b]">Frequencies, minimum quantities, and end-of-term behavior (auto-close, renew, pause)</p>
        </div>
        ${isAdmin ? `
          <button onclick="window.openAddPlanModal()" 
            class="inline-flex items-center gap-1.5 bg-[#006a61] hover:bg-[#005049] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">add</span>
            <span>Create New Plan</span>
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${state.plans.map(plan => `
          <div class="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2.5 py-0.5 rounded-full bg-[#1e2a4a] text-white text-xs font-mono font-bold uppercase tracking-wider">
                  ${plan.recurrence}
                </span>
                <span class="text-xs font-mono text-[#006a61] font-bold">Min Quantity: ${plan.minQuantity} seat(s)</span>
              </div>
              <h3 class="text-base font-bold text-[#081534]">${plan.name}</h3>
              <p class="text-xs text-[#64748b] mt-1">${plan.description}</p>
            </div>

            <div class="bg-[#f8f9ff] p-3 rounded-lg border border-[#e2e8f0] space-y-1.5 text-xs font-mono">
              <div class="flex justify-between">
                <span class="text-[#76777f]">Price per seat:</span>
                <span class="font-bold text-[#081534]">₹${plan.price.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#76777f]">Validity window:</span>
                <span class="text-[#45464e]">${plan.availableFrom} to ${plan.availableTo}</span>
              </div>
              <div class="flex justify-between pt-1 border-t border-[#cbd5e1] text-[11px]">
                <span class="text-[#76777f]">Lifecycle behavior:</span>
                <span class="text-[#006a61]">
                  ${plan.autoClose ? 'Closes automatically on end' : 'Auto-renews'} • ${plan.allowPause ? 'Can pause' : 'No pause'}
                </span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDiscountsView(state, isAdmin) {
  return `
    <div class="flex flex-col gap-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-base font-bold text-[#081534]">Automated Discount Rules</h2>
          <p class="text-xs text-[#64748b]">Fixed cash deductions (₹) or percentages, min spend/quantity thresholds, and usage limits</p>
        </div>
        ${isAdmin ? `
          <button onclick="window.openAddDiscountModal()" 
            class="inline-flex items-center gap-1.5 bg-[#006a61] hover:bg-[#005049] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">add</span>
            <span>Create Discount Rule</span>
          </button>
        ` : ''}
      </div>

      <div class="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#cbd5e1] text-[#76777f] uppercase font-semibold bg-[#f8f9ff]">
                <th class="py-3 px-3">Rule Code</th>
                <th class="py-3 px-3">Description</th>
                <th class="py-3 px-3">Discount Type</th>
                <th class="py-3 px-3">Eligibility Conditions</th>
                <th class="py-3 px-3">Usage Counter</th>
                <th class="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f1f5f9]">
              ${state.discountRules.map(d => `
                <tr class="hover:bg-[#f8f9ff]">
                  <td class="py-3 px-3 font-mono font-bold text-[#081534]">${d.code}</td>
                  <td class="py-3 px-3">
                    <div class="font-medium text-[#0b1c30]">${d.name}</div>
                    <div class="text-[11px] text-[#76777f] font-mono">Scope: ${d.scope}</div>
                  </td>
                  <td class="py-3 px-3 font-mono font-semibold text-[#006a61]">
                    ${d.type === 'percentage' ? `${d.value}% Off` : `₹${d.value.toFixed(2)} Off`}
                  </td>
                  <td class="py-3 px-3 font-mono text-[11px] text-[#45464e]">
                    Min Order: ₹${d.minSubtotal} • Min Seats: ${d.minQuantity}
                  </td>
                  <td class="py-3 px-3 font-mono">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-[#081534]">${d.currentUses} / ${d.maxUses}</span>
                      <div class="w-16 bg-[#eff4ff] h-1.5 rounded-full overflow-hidden">
                        <div class="bg-[#006a61] h-full" style="width: ${(d.currentUses / d.maxUses) * 100}%"></div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <span class="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                      d.status === 'active' 
                        ? 'bg-[#86f2e4]/30 text-[#006f66]' 
                        : 'bg-red-50 text-[#ba1a1a]'
                    }">
                      ${d.status.toUpperCase()}
                    </span>
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

function renderTaxesView(state, isAdmin) {
  return `
    <div class="flex flex-col gap-6">
      <div>
        <h2 class="text-base font-bold text-[#081534]">GST & Tax Rules</h2>
        <p class="text-xs text-[#64748b]">Taxes are applied automatically on billing day based on these admin rules</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${state.taxRules.map(tax => `
          <div class="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono font-bold text-[#006a61]">${tax.jurisdiction}</span>
                <span class="w-2 h-2 rounded-full bg-[#006a61]"></span>
              </div>
              <h3 class="text-sm font-bold text-[#081534]">${tax.name}</h3>
            </div>
            <div class="mt-4 pt-3 border-t border-[#f1f5f9] flex justify-between items-baseline font-mono">
              <span class="text-xs text-[#64748b]">Rate:</span>
              <span class="text-lg font-bold text-[#081534]">${tax.rate}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
