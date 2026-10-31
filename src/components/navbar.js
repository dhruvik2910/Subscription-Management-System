// src/components/navbar.js - Top Header Navigation & Role Switcher
import { store } from '../store.js';

export function renderNavbar() {
  const state = store.getState();
  const currentRole = state.currentRole;
  const user = state.currentUser[currentRole];
  const activeRoute = state.activeRoute;
  const isCustomer = currentRole === 'customer';

  return `
    <header class="fixed top-0 left-0 right-0 w-full z-50 bg-[#f8f9ff]/95 backdrop-blur-md border-b border-[#e2e8f0] shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      <div class="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        <!-- Logo & Branding -->
        <div class="flex items-center gap-3 shrink-0 cursor-pointer" onclick="window.appNavigate('revenue-operations')">
          <div class="w-8 h-8 rounded-lg bg-[#081534] text-white flex items-center justify-center font-bold text-base shadow-sm">
            B
          </div>
          <div>
            <span class="font-bold text-base text-[#081534] tracking-tight">Brightloop</span>
            <span class="hidden sm:inline-block ml-1.5 text-[11px] font-mono text-[#006a61] bg-[#86f2e4]/30 px-2 py-0.5 rounded-full font-semibold">
              Subscriptions (INR ₹)
            </span>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="hidden lg:flex items-center gap-1">
          ${!isCustomer ? `
            <button onclick="window.appNavigate('revenue-operations')" 
              class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeRoute === 'revenue-operations' 
                  ? 'bg-[#1e2a4a] text-white shadow-sm' 
                  : 'text-[#45464e] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
              }">
              Revenue Overview
            </button>
            <button onclick="window.appNavigate('subscriptions-quotes')" 
              class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeRoute === 'subscriptions-quotes' 
                  ? 'bg-[#1e2a4a] text-white shadow-sm' 
                  : 'text-[#45464e] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
              }">
              Subscriptions & Quotes
            </button>
            <button onclick="window.appNavigate('billing-invoices')" 
              class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeRoute === 'billing-invoices' 
                  ? 'bg-[#1e2a4a] text-white shadow-sm' 
                  : 'text-[#45464e] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
              }">
              Billing & Invoices
            </button>
            ${currentRole === 'admin' ? `
              <button onclick="window.appNavigate('products-plans')" 
                class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeRoute === 'products-plans' 
                    ? 'bg-[#1e2a4a] text-white shadow-sm' 
                    : 'text-[#45464e] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
                }">
                Plans & Catalog
              </button>
            ` : ''}
          ` : `
            <button onclick="window.appNavigate('customer-portal')" 
              class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all bg-[#1e2a4a] text-white shadow-sm">
              My Subscription Portal
            </button>
          `}
        </nav>

        <!-- Right Side: Search, New Quote, Manage Staff, Role Switcher -->
        <div class="flex items-center gap-2.5 shrink-0">
          
          <!-- Cmd+K Search -->
          <button onclick="window.openSearchModal()" 
            class="hidden md:flex items-center bg-[#eff4ff] hover:bg-[#e5eeff] text-[#76777f] px-2.5 py-1.5 rounded-lg gap-2 text-xs transition-colors border border-[#dce9ff]"
            title="Search anything">
            <span class="material-symbols-outlined text-sm">search</span>
            <span>Search...</span>
            <kbd class="font-mono bg-white px-1.5 py-0.5 rounded text-[10px] text-[#45464e] border border-[#c6c6cf]">⌘K</kbd>
          </button>

          <!-- Staff Management (Admin Only) -->
          ${currentRole === 'admin' ? `
            <button onclick="window.openStaffModal()" 
              class="inline-flex items-center gap-1.5 bg-white border border-[#cbd5e1] hover:bg-[#eff4ff] text-[#081534] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
              title="Only the admin can add new staff members">
              <span class="material-symbols-outlined text-sm text-[#006a61]">group_add</span>
              <span class="hidden sm:inline">Manage Staff</span>
            </button>
          ` : ''}

          <!-- New Quote Button (Internal Staff & Admin) -->
          ${!isCustomer ? `
            <button onclick="window.openNewQuoteModal()" 
              class="inline-flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#081534] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all">
              <span class="material-symbols-outlined text-sm">add</span>
              <span>New Quote</span>
            </button>
          ` : ''}

          <!-- Role Switcher Dropdown -->
          <div class="relative group">
            <button class="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#e5eeff] border border-[#dce9ff] transition-colors">
              <img src="${user.avatar}" alt="${user.name}" class="w-7 h-7 rounded-full object-cover border border-white" />
              <div class="hidden xl:flex flex-col text-left">
                <span class="text-xs font-semibold text-[#0b1c30] leading-none">${user.name}</span>
                <span class="text-[10px] text-[#006a61] uppercase tracking-wider font-bold mt-0.5">${user.title.split('•')[0]}</span>
              </div>
              <span class="material-symbols-outlined text-sm text-[#76777f]">arrow_drop_down</span>
            </button>

            <!-- Role Menu -->
            <div class="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#cbd5e1] p-1.5 hidden group-hover:block hover:block z-50">
              <div class="px-3 py-2 border-b border-[#f1f5f9]">
                <p class="text-[11px] font-semibold text-[#76777f] uppercase tracking-wider">Switch View</p>
                <p class="text-xs text-[#45464e] mt-0.5">Test role-specific access permissions</p>
              </div>
              <div class="p-1 space-y-0.5">
                <button onclick="window.switchRole('admin')" class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#eff4ff] ${currentRole === 'admin' ? 'bg-[#eff4ff] font-bold text-[#081534]' : 'text-[#45464e]'}">
                  <div>
                    <div class="font-medium text-[#0b1c30]">Elena Rostova (Admin)</div>
                    <div class="text-[10px] text-[#76777f]">Controls products, plans, taxes, discounts, staff</div>
                  </div>
                  ${currentRole === 'admin' ? '<span class="material-symbols-outlined text-sm text-[#006a61]">check</span>' : ''}
                </button>
                <button onclick="window.switchRole('staff')" class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#eff4ff] ${currentRole === 'staff' ? 'bg-[#eff4ff] font-bold text-[#081534]' : 'text-[#45464e]'}">
                  <div>
                    <div class="font-medium text-[#0b1c30]">Rohan Mehta (Internal Staff)</div>
                    <div class="text-[10px] text-[#76777f]">Handles quotes, billing, invoices & payments</div>
                  </div>
                  ${currentRole === 'staff' ? '<span class="material-symbols-outlined text-sm text-[#006a61]">check</span>' : ''}
                </button>
                <button onclick="window.switchRole('customer')" class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#eff4ff] ${currentRole === 'customer' ? 'bg-[#eff4ff] font-bold text-[#081534]' : 'text-[#45464e]'}">
                  <div>
                    <div class="font-medium text-[#0b1c30]">Aarav Patel (Customer Portal)</div>
                    <div class="text-[10px] text-[#76777f]">Self-service view for Apex Retail Pvt Ltd</div>
                  </div>
                  ${currentRole === 'customer' ? '<span class="material-symbols-outlined text-sm text-[#006a61]">check</span>' : ''}
                </button>
              </div>
              <div class="border-t border-[#f1f5f9] mt-1 pt-1">
                <button onclick="window.openAuthModal()" class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#006a61] font-semibold hover:bg-[#eff4ff] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">lock_reset</span>
                  <span>Signup & Password Reset Demo</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  `;
}
