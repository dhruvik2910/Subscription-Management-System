---
name: Brightloop Enterprise Billing System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777f'
  outline-variant: '#c6c6cf'
  surface-tint: '#525d80'
  primary: '#081534'
  on-primary: '#ffffff'
  primary-container: '#1e2a4a'
  on-primary-container: '#8691b7'
  inverse-primary: '#bac5ee'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#001b10'
  on-tertiary: '#ffffff'
  tertiary-container: '#003220'
  on-tertiary-container: '#27a577'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#bac5ee'
  on-primary-fixed: '#0d1a39'
  on-primary-fixed-variant: '#3a4667'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  label-num-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

The brand personality projects institutional rigor, high-velocity precision, and absolute fiscal trustworthiness. Geared toward enterprise CFOs, RevOps leaders, and billing administrators managing high-volume recurring revenue, the aesthetic balances modern SaaS ergonomics with the mission-critical stability expected of transactional software.

The UI leverages a refined **Corporate / Modern** design paradigm infused with crisp structural minimalism. Visual clarity takes precedence over ornamentation: dense analytical dashboards, ledger-level balance reconciliation, and lifecycle progress workflows require a dependable, zero-latency visual environment. Subtle depth, disciplined grid lines, micro-borders, and focused functional color coding establish hierarchy without producing cognitive friction.

## Colors

The palette establishes an authoritative fiscal atmosphere using deep slate indigo for core architecture, tempered with purpose-driven semantic indicators.

- **Primary (`#1E2A4A`)**: A structured enterprise deep indigo navy used for primary structural navigation, high-contrast actions, primary typography, and terminal state indicators.
- **Secondary (`#0D9488`)**: Deep teal supporting secondary brand identity, interactive focus rings, and neutral metadata highlights.
- **Tertiary / Success (`#059669`)**: Vivid emerald reserved exclusively for revenue generation, active subscription states, settled payments, positive delta metrics, and positive ARR adjustments.
- **Warning / Pipeline (`#D97706`)**: Warm amber allocated to pending balances, open quotations, pro-forma states, and dunning warning thresholds.
- **Destructive / Error (`#DC2626`)**: Crisp, controlled crimson for churn events, delinquent accounts, payment failures, and voided invoices.
- **Neutral Palette (`#64748B` to `#0F172A`)**: Cool slate neutrals calibrated to deliver balanced border contrast (`#E2E8F0`), alternate row fills (`#F8FAFC`), and tertiary table metadata (`#94A3B8`).

## Typography

The type system pairs **Inter** for foundational navigation, dense interfaces, and content readability with **JetBrains Mono** for numerical accuracy and data parsing.

- **Inter**: Governs primary reading patterns, table content, headers, and form inputs. Optical tracking scales tighter at larger headlines to preserve visual cohesion in multi-metric dashboards.
- **JetBrains Mono**: Used strictly for financial telemetry, ledger columns, currency indicators, invoice IDs, coupon codes, and transaction hashes. It enforces rigid tabular alignment across dense rows, preventing visual jitter during frequent data updates and table sorting.

## Layout & Spacing

The layout model is anchored to an 8px base rhythm (with 4px sub-increments) organized within a fluid, responsive 12-column grid.

- **Desktop (1280px+)**: 12-column fluid grid, `margin-lg` (2rem) page gutters, `gutter-lg` (1.5rem) column gap. Optimized for high data density, allowing horizontal arrangements of metric cards alongside comprehensive balance sheets.
- **Tablet (768px - 1279px)**: 8-column layout, `margin-md` (1.5rem) exterior boundaries, collapsing sidebars into a collapsed icon rail or sliding drawer.
- **Mobile (< 768px)**: 4-column layout, `margin` (1rem) safe edges, converting tabular sheets into grouped key-value cards.

Spacing tokens prioritize compact internal container paddings (`space-xs` to `space-md`) to ensure critical metrics remain within immediate view above the fold.

## Elevation & Depth

This design system avoids theatrical drop shadows in favor of **tonal surface layering paired with crisp low-contrast outlines**.

- **Level 0 (Canvas Base)**: `#F8FAFC`. The default application workspace background behind grid modules.
- **Level 1 (Card & Module Layer)**: `#FFFFFF` surfaced with a 1px border stroke (`#E2E8F0`). Flat elevation; depth is created entirely by tone.
- **Level 2 (Dropdowns & Popovers)**: `#FFFFFF` with a 1px border (`#CBD5E1`) and an ultra-diffused ambient shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Overlays & Drawer Sidebars)**: Elevated atop a tinted backdrop blur (`rgba(15, 23, 42, 0.4)` with 4px backdrop blur). Outlined via `#CBD5E1` with a deep structural shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`.

## Shapes

The interface implements a **Soft (Level 1)** geometric standard. This geometry produces a structured, technical aesthetic that conserves screen real estate across data-dense grids while avoiding the harshness of completely sharp corners.

- Base interactive inputs, table action buttons, and cells adhere to a `0.25rem` (4px) corner radius.
- Cards, KPI metrics containers, modals, and slide-over panels use `0.5rem` (8px).
- Status badges and micro-chips utilize pill-shaped geometries (`9999px`) to create clear visual separation between interactive rectangular buttons and passive state indicators.

## Components

### Buttons
- **Primary**: Solid `#1E2A4A` fill, white text, 4px corner radius, standard height 36px (compact 32px for table rows). Hover shifts to `#162038`.
- **Secondary**: Surface `#FFFFFF`, 1px border `#CBD5E1`, text `#1E2A4A`. Hover shifts to `#F1F5F9`.
- **Destructive**: Borderless subtle `#FEE2E2` fill with `#DC2626` text; active click transitions to solid `#DC2626` with white text.

### High-Density Data Tables
- Headers display `label-caps` in `#64748B` with a solid bottom border (`#CBD5E1`), compact padding (`8px 12px`).
- Cells feature 36px row height with a light divider line (`#F1F5F9`). Alternating row striping uses `#F8FAFC`.
- All monetary sums and identifier tags utilize `JetBrains Mono` with right-aligned numeric placement.

### KPI Metric Cards
- White surface, 1px border `#E2E8F0`, 8px corner radius, internal padding `1rem`.
- Contains title (`body-sm`, `#64748B`), primary metric (`label-num-lg`, `#1E2A4A`), and trend indicator:
  - Positive: `#ECFDF5` chip with `#059669` text and upward directional glyph.
  - Negative / Risk: `#FEF2F2` chip with `#DC2626` text and downward directional glyph.

### Subscription Lifecycle Stepper
- Sequential node component representing lifecycle phases: `Draft -> Quotation -> Confirmed -> Active -> Closed`.
- **Completed**: Solid `#059669` circular node with check icon, joined by a solid 2px emerald connecting line.
- **Active / Current**: Ring-highlighted `#1E2A4A` node with bold indicator text.
- **Pending / Upcoming**: Outlined `#CBD5E1` node, dashed neutral line, `#94A3B8` label text.

### Status Chips & Badges
- **Active / Paid**: `#ECFDF5` background, `#047857` label, 2px border radius.
- **Quotation / Pending**: `#FFFBEB` background, `#B45309` label.
- **Overdue / Churned**: `#FEF2F2` background, `#B91C1C` label.

### Input Fields & Controls
- Standard height 36px. 1px border `#CBD5E1`, 4px radius, `#0F172A` text.
- Focus state: Border transitions to `#0D9488` with a 2px outer ring in `rgba(13, 148, 136, 0.15)`.
- Numeric billing inputs embed ISO currency identifiers (`USD`, `EUR`) in monospace inside a fixed `#F1F5F9` left prefix unit.