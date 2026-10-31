// src/components/navbar.js - Clean, Minimal Header & Role Switcher
import { store } from '../store.js';

export function renderNavbar() {
  const state = store.getState();
  const currentRole = state.currentRole;
  const user = state.currentUser[currentRole];
  const activeRoute = state.activeRoute;
  const isCustomer = currentRole === 'customer';
  const isConnected = state.isServerConnected;

  return `
    <header class="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div class="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        <!-- Logo & Brand Identity -->
        <div class="flex items-center gap-3 cursor-pointer select-none" onclick="window.appNavigate('revenue-operations')">
          <div class="w-8 h-8 rounded-lg bg-[#081534] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            B
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-base text-[#081534] tracking-tight">Brightloop</span>
            <span class="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
              Billing (₹)
            </span>
          </div>
        </div>

        <!-- Clean Navigation Tabs -->
        <nav class="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
          ${!isCustomer ? `
            <button onclick="window.appNavigate('revenue-operations')" 
              class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRoute === 'revenue-operations' 
                  ? 'bg-white text-[#081534] shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }">
              Dashboard
            </button>
            <button onclick="window.appNavigate('subscriptions-quotes')" 
              class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRoute === 'subscriptions-quotes' 
                  ? 'bg-white text-[#081534] shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }">
              Subscriptions
            </button>
            <button onclick="window.appNavigate('billing-invoices')" 
              class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeRoute === 'billing-invoices' 
                  ? 'bg-white text-[#081534] shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }">
              Invoices
            </button>
            ${currentRole === 'admin' ? `
              <button onclick="window.appNavigate('products-plans')" 
                class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeRoute === 'products-plans' 
                    ? 'bg-white text-[#081534] shadow-sm font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }">
                Plans & Catalog
              </button>
            ` : ''}
          ` : `
            <button onclick="window.appNavigate('customer-portal')" 
              class="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-[#081534] shadow-sm font-semibold">
              My Subscription Portal
            </button>
          `}
        </nav>

        <!-- Right Side: DB Status, New Quote, Role Switcher -->
        <div class="flex items-center gap-3">
          
          <!-- SQLite DB Connection Pill -->
          <div class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono ${
            isConnected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }" title="Connected to SQLite Database via REST API">
            <span class="w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
            <span>${isConnected ? 'SQLite Active' : 'Local State'}</span>
          </div>

          <!-- Staff Management (Admin Only) -->
          ${currentRole === 'admin' ? `
            <button onclick="window.openStaffModal()" 
              class="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium transition-colors"
              title="Only the admin can add new staff members">
              <span class="material-symbols-outlined text-sm text-teal-700">group</span>
              <span>Staff</span>
            </button>
          ` : ''}

          <!-- New Quote Button -->
          ${!isCustomer ? `
            <button onclick="window.openNewQuoteModal()" 
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#081534] hover:bg-[#1e2a4a] text-white text-xs font-semibold shadow-sm transition-all">
              <span class="material-symbols-outlined text-sm">add</span>
              <span>New Quote</span>
            </button>
          ` : ''}

          <!-- User Role Switcher -->
          <div class="relative group">
            <button class="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
              <img src="${user.avatar}" alt="${user.name}" class="w-6 h-6 rounded-full object-cover" />
              <div class="hidden xl:flex flex-col text-left">
                <span class="text-xs font-semibold text-slate-900 leading-tight">${user.name}</span>
                <span class="text-[10px] text-teal-700 font-medium capitalize">${currentRole}</span>
              </div>
              <span class="material-symbols-outlined text-xs text-slate-500">expand_more</span>
            </button>

            <!-- Role Dropdown -->
            <div class="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 hidden group-hover:block hover:block z-50">
              <div class="px-3 py-1.5 border-b border-slate-100 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Switch User View
              </div>
              <div class="p-1 space-y-0.5">
                <button onclick="window.switchRole('admin')" class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${currentRole === 'admin' ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-600'}">
                  <div>
                    <div class="font-medium text-slate-900">Elena Rostova</div>
                    <div class="text-[10px] text-slate-500">Admin (Products, Plans, Staff)</div>
                  </div>
                  ${currentRole === 'admin' ? '<span class="material-symbols-outlined text-sm text-teal-600">check</span>' : ''}
                </button>
                <button onclick="window.switchRole('staff')" class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${currentRole === 'staff' ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-600'}">
                  <div>
                    <div class="font-medium text-slate-900">Rohan Mehta</div>
                    <div class="text-[10px] text-slate-500">Staff (Quotes, Invoices & Billing)</div>
                  </div>
                  ${currentRole === 'staff' ? '<span class="material-symbols-outlined text-sm text-teal-600">check</span>' : ''}
                </button>
                <button onclick="window.switchRole('customer')" class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${currentRole === 'customer' ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-600'}">
                  <div>
                    <div class="font-medium text-slate-900">Aarav Patel</div>
                    <div class="text-[10px] text-slate-500">Customer (Apex Retail Portal)</div>
                  </div>
                  ${currentRole === 'customer' ? '<span class="material-symbols-outlined text-sm text-teal-600">check</span>' : ''}
                </button>
              </div>
              <div class="border-t border-slate-100 mt-1 pt-1">
                <button onclick="window.openAuthModal()" class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-teal-700 font-medium hover:bg-slate-50 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">lock_reset</span>
                  <span>Strict Password & Auth Demo</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  `;
}
