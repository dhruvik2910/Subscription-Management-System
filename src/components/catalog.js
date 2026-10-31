// src/components/catalog.js - Clean, Minimal Product Catalog, Plans & Discounts
import { store } from '../store.js';

let activeCatalogTab = 'variants'; // 'variants' | 'plans' | 'discounts'

export function setCatalogTab(tab) {
  activeCatalogTab = tab;
}

export function renderCatalog() {
  const state = store.getState();
  const isAdmin = state.currentRole === 'admin';

  return `
    <div class="flex flex-col gap-6 w-full animate-fade-in">
      
      <!-- Top Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-[#081534] tracking-tight">Plans & Product Catalog</h1>
          <p class="text-xs text-slate-500 mt-1">
            Software products, brand editions (Odoo brand adds ₹560), recurring billing cadences, and discount rules.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            isAdmin ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-600'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-teal-600' : 'bg-slate-400'}"></span>
            ${isAdmin ? 'Admin Mode (Full Access)' : 'Staff Mode (Read Only)'}
          </span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-1 border-b border-slate-200 text-xs font-medium">
        <button onclick="window.switchCatalogTab('variants')" 
          class="pb-2.5 px-3 border-b-2 transition-colors ${activeCatalogTab === 'variants' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Products & Brand Variants (${state.products.length})
        </button>
        <button onclick="window.switchCatalogTab('plans')" 
          class="pb-2.5 px-3 border-b-2 transition-colors ${activeCatalogTab === 'plans' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Recurring Cadences (${state.plans.length})
        </button>
        <button onclick="window.switchCatalogTab('discounts')" 
          class="pb-2.5 px-3 border-b-2 transition-colors ${activeCatalogTab === 'discounts' ? 'border-[#081534] text-[#081534] font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Discount Rules (${state.discountRules.length})
        </button>
      </div>

      <!-- Tab Content Area -->
      ${activeCatalogTab === 'variants' ? renderProductsAndVariants(state, isAdmin) : ''}
      ${activeCatalogTab === 'plans' ? renderPlansView(state, isAdmin) : ''}
      ${activeCatalogTab === 'discounts' ? renderDiscountsView(state, isAdmin) : ''}

    </div>
  `;
}

function renderProductsAndVariants(state, isAdmin) {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-sm font-semibold text-slate-800">Configured Software Products</h2>
        ${isAdmin ? `
          <button onclick="window.openAddVariantModal()" 
            class="inline-flex items-center gap-1.5 bg-[#081534] hover:bg-[#1e2a4a] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">add</span>
            <span>Add Brand Variant</span>
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 gap-4">
        ${state.products.map(prod => {
          const basePrice = prod.base_price !== undefined ? prod.base_price : (prod.salesPrice || 0);
          const variants = prod.variants || [];

          return `
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
              
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-base font-bold text-[#081534]">${prod.name}</h3>
                    <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono">${prod.category}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">${prod.description || prod.notes || 'SAC 998313'}</p>
                </div>

                <div class="text-right shrink-0">
                  <span class="text-[11px] text-slate-400 uppercase tracking-wider block">Base Price</span>
                  <span class="font-mono text-xl font-bold text-[#081534]">₹${basePrice.toFixed(2)}</span>
                </div>
              </div>

              <!-- Brand Edition Variants Table -->
              <div class="border-t border-slate-100 pt-3">
                <div class="text-xs font-semibold text-slate-700 mb-2">Brand Edition Variants</div>
                <div class="border border-slate-200 rounded-lg overflow-hidden">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold text-[11px]">
                        <th class="py-2 px-3">Variant Name</th>
                        <th class="py-2 px-3">Price Adjustment</th>
                        <th class="py-2 px-3 text-right">Effective Recurring Price</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${variants.map(v => {
                        const extraPrice = v.extra_price !== undefined ? v.extra_price : (v.priceModifier || 0);
                        const varName = v.variant_name || v.name || 'Standard';
                        const isOdoo = varName.toLowerCase().includes('odoo');

                        return `
                          <tr class="hover:bg-slate-50/60">
                            <td class="py-2 px-3">
                              <span class="font-medium text-slate-900">${varName}</span>
                              ${isOdoo ? `
                                <span class="ml-2 px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                                  Odoo Brand Variant (+₹560)
                                </span>
                              ` : ''}
                            </td>
                            <td class="py-2 px-3 font-mono text-slate-600">
                              ${extraPrice > 0 ? `+₹${extraPrice.toFixed(2)}` : '₹0.00 (Base)'}
                            </td>
                            <td class="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                              ₹${(basePrice + extraPrice).toFixed(2)}
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderPlansView(state, isAdmin) {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-sm font-semibold text-slate-800">Recurring Cadences & Auto-Close Rules</h2>
        ${isAdmin ? `
          <button onclick="window.openAddPlanModal()" 
            class="inline-flex items-center gap-1.5 bg-[#081534] hover:bg-[#1e2a4a] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">add</span>
            <span>Create New Plan</span>
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${state.plans.map(plan => {
          const period = plan.billing_period || plan.recurrence || 'monthly';
          return `
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold uppercase">
                    ${period}
                  </span>
                  <span class="text-xs text-teal-700 font-medium">Auto-Close: ${plan.auto_close_days || 15} days</span>
                </div>
                <h3 class="text-base font-bold text-[#081534]">${plan.name}</h3>
                <p class="text-xs text-slate-500 mt-1">${plan.description || 'Configured recurring billing schedule'}</p>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Direct Idempotent Batch Runs</span>
                <span class="text-teal-700 font-semibold">Active Cadence</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderDiscountsView(state, isAdmin) {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-sm font-semibold text-slate-800">Configured Discount Rules</h2>
        ${isAdmin ? `
          <button onclick="window.openAddDiscountModal()" 
            class="inline-flex items-center gap-1.5 bg-[#081534] hover:bg-[#1e2a4a] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all">
            <span class="material-symbols-outlined text-sm">add</span>
            <span>Add Discount Rule</span>
          </button>
        ` : ''}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${state.discountRules.map(d => {
          const discountType = d.discount_type || d.type || 'fixed';
          const discountVal = d.discount_value !== undefined ? d.discount_value : (d.value || 0);

          return `
            <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">${d.code}</span>
                <span class="text-xs font-mono font-semibold text-slate-800">
                  ${discountType === 'percent' ? `${discountVal}% Off` : `₹${discountVal.toFixed(2)} Flat Off`}
                </span>
              </div>
              <p class="text-xs text-slate-600">${d.description || d.name}</p>
              <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Min: ₹${(d.min_purchase_amount || d.minSubtotal || 0).toLocaleString('en-IN')}</span>
                <span>Used: ${d.used_count || d.currentUses || 0} times</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
