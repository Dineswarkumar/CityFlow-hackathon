---
name: Mission Control & Urban Intelligence
colors:
  surface: '#0c1322'
  surface-dim: '#0c1322'
  surface-bright: '#323949'
  surface-container-lowest: '#070e1d'
  surface-container-low: '#141b2b'
  surface-container: '#191f2f'
  surface-container-high: '#232a3a'
  surface-container-highest: '#2e3545'
  on-surface: '#dce2f7'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dce2f7'
  inverse-on-surface: '#293040'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e79400'
  on-tertiary-container: '#563400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0c1322'
  on-background: '#dce2f7'
  surface-variant: '#2e3545'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
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
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-telemetry:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  label-badge:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.5rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies high-stakes municipal oversight, predictive corridor analytics, and automated transit orchestration. It speaks directly to traffic management directors, infrastructure engineers, and smart-city dispatchers who require real-time situational awareness without visual noise.

The aesthetic fuses tactical mission-control precision with a sophisticated dark-mode glassmorphic structure. Data density is prioritized through clear structural boundaries, luminous state indicators, and disciplined spatial organization. Visual hierarchy relies on high-contrast telemetry accents emerging from deep-space charcoal and slate surfaces, projecting calm authority, operational readiness, and high reliability.

## Colors

The system uses a dark base designed for multi-display operations centers and low-fatigue 24/7 monitoring.

- **Primary (`#06B6D4` - Luminous Cyan):** Used for primary command triggers, active corridor selections, real-time vehicle vectors, and key data visualizations.
- **Secondary (`#10B981` - Emerald Green):** Denotes nominal flow, clearing patterns, active automated interventions, and positive health statuses.
- **Tertiary (`#F59E0B` - Safety Amber):** Signals flow congestion, advisory warnings, queue threshold saturation, and pending human-in-the-loop approvals.
- **Critical Alert (`#EF4444` - Crimson):** Reserved exclusively for severe gridlocks, collision incidents, emergency corridor preemption, and sensor dropouts.
- **Neutral Base (`#0B0F19` & `#111827`):** Forms the foundational environment. Deep charcoal anchors the backdrop canvas, while slate provides structural framing and translucent glass surface base layers. Subdued borders use slate tints with 15–25% alpha.

## Typography

Typography prioritizes rapid legibility under high cognitive load. **Inter** manages UI navigation, standard narrative metrics, and analytical readouts with crisp geometric neutral shapes.

**JetBrains Mono** serves as the operational voice. It is applied to corridor IDs (e.g., `CR-0067`, `ND-015`), coordinates, camera feeds, network throughput, signal phase counts, and timestamp logs. Tabular figures ensure aligned columns in high-density data tables and live metric tickers.

## Layout & Spacing

The layout adopts a high-density, screen-filling fluid grid architecture optimized for widescreen tactical command consoles and multi-panel dashboards.

- **Grid Architecture:** Desktop views operate on a 12-column or 24-column subgrid supporting persistent map viewports flanked by collapsible telemetry rails.
- **Docking and Panels:** Modular side-drawers anchor telemetry streams and control nodes without breaking the central GIS map context.
- **Breakpoints & Reflow:** 
  - **Desktop (1280px+):** Tri-pane view with fixed-position operational rail, central GIS projection, and dynamic analytical inspector.
  - **Tablet (768px - 1279px):** Split-view with bottom sheet or modal overlays for detailed corridor telemetry.
  - **Mobile (<768px):** Single-column stacked layout prioritizing quick-action switches, incident tickers, and card-based alerts over persistent mapping.

## Elevation & Depth

Visual hierarchy is maintained through translucent slate glassmorphism, surface tonal gradations, and localized luminescence rather than heavy drop shadows.

- **Base Layer (Level 0):** Canvas background `#0B0F19` hosting GIS mapping tiles, terrain vector layers, and coordinate grids.
- **Surface Layer (Level 1):** Translucent structural cards styled with `#111827` at 70% opacity, paired with an 8px to 12px backdrop blur. Structural edges use a 1px border of `rgba(255, 255, 255, 0.08)`.
- **Floating Panels & Controls (Level 2):** Elevated overlays and context menus styled with `#1F2937` at 85% opacity, backdrop blur of 16px, and a subtle border glow matching the active contextual status (e.g., cyan `rgba(6, 182, 212, 0.25)` or crimson `rgba(239, 68, 68, 0.3)`).
- **Overlay & Modals (Level 3):** Highest tier tactical intervention modals utilize 95% opacity `#111827` framed by a high-intensity directional glow (`0 0 24px rgba(6, 182, 212, 0.2)`).

## Shapes

The design system uses soft, compact corners (`0.25rem` base, up to `0.5rem` on master surfaces). This slight geometric rounding maintains an industrial, instrumentation-grade feel.

Curvatures are deliberate and restrained to maximize screen real estate, preserve sharp grid lines, and maintain visual cohesion across data-dense panels. Micro-elements like pills, badges, and toggle indicators use constrained border radii to avoid organic or casual styling.

## Components

### Buttons & Tactical Triggers
- **Primary Action:** Solid `#06B6D4` with dark `#081524` text for maximum contrast; active state triggers a localized `0 0 12px rgba(6, 182, 212, 0.5)` cyan glow.
- **Secondary / Tactical:** Outlined `rgba(255, 255, 255, 0.15)` border with translucent dark slate fill. Hover states intensify border brightness to `rgba(255, 255, 255, 0.4)`.
- **Destructive / Override:** High-contrast crimson stroke `#EF4444` with a dark red semi-transparent fill (`rgba(239, 68, 68, 0.1)`).

### Status Badges & Chips
- Designed with `JetBrains Mono` bold uppercase typography.
- Surrounded by an ultra-thin 1px border and an ambient dot indicator with pulse effects for live conditions (`CRITICAL`, `MONITORED`, `NOMINAL`, `PREEMPTED`).
- Backgrounds remain dark and low-saturation, leaving pure saturation to the border and dot to avoid visual clutter.

### Input Fields & Selectors
- Background: `#0B0F19` inset with a 1px border (`rgba(255, 255, 255, 0.1)`).
- Focus state activates a sharp `#06B6D4` 1px border and a subtle cyan illumination ring.
- Integrated monospace tags indicate corridor search tokens and geospatial query parameters.

### Cards & Container Panels
- Glass-backed containers with hairline borders (`rgba(255, 255, 255, 0.08)`).
- Header sections feature a distinct micro-divider and JetBrains Mono metadata identifiers (`SYS.ID // 4098`).
- Interactive cards provide quick-action pins to freeze or isolate map views.

### Domain-Specific Components
- **Corridor Flow Metric Bars:** Segmented linear bars displaying vehicle volume, signal phase splits, and saturation velocity.
- **Incident Feed Item:** Left-bordered card keyed to incident severity color (Crimson, Amber, Cyan) with timestamped event logging.
- **Telemetry HUD Tickers:** Ultra-compact, single-line data ribbons showing aggregate network velocity, active congestion alerts, and autonomous interventions.