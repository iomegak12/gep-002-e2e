---
name: Order Oasis
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
  on-surface-variant: '#3d4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#006399'
  on-secondary: '#ffffff'
  secondary-container: '#7bc2ff'
  on-secondary-container: '#004f7b'
  tertiary: '#924628'
  on-tertiary: '#ffffff'
  tertiary-container: '#b05e3d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#cde5ff'
  secondary-fixed-dim: '#94ccff'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#004b74'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#773215'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Roboto
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Roboto
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Roboto
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-base:
    fontFamily: Roboto
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Roboto
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Roboto
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Roboto Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  widget-gap: 16px
  table-cell-padding: 8px 12px
  sidebar-width: 240px
  sidebar-collapsed: 64px
---

## Brand & Style

This design system is engineered for the high-velocity world of Supply Chain Management. The brand personality is **Precise, Reliable, and Perceptive**, prioritizing data clarity and operational efficiency over decorative flair. It targets logistics managers, procurement officers, and data analysts who require a "source of truth" dashboard that remains legible during long shifts.

The visual style is **Corporate / Modern** with a focus on **Data Density**. It utilizes a structured "Container-in-Container" approach to organize complex information hierarchies. By combining the rigorous alignment of enterprise software with the soft aesthetics of modern SaaS, the system evokes a sense of calm control within complex global supply chains.

## Colors

The color strategy employs a sophisticated palette designed for dual-mode endurance. 

- **Primary Actions:** A professional Teal (`#0D9488`) serves as the primary action color, offering high visibility without the aggression of pure red or the passivity of standard blue.
- **Light Mode:** Focuses on "Paper & Ink" contrast. Surfaces use crisp whites with background offsets in soft cool-grays to define boundaries without heavy lines.
- **Dark Mode:** Utilizes deep "Charcoal" levels rather than pure black to reduce eye strain. Accent colors (Teal and Blue) are shifted slightly in saturation to "glow" against the dark surfaces, ensuring critical alerts are never missed.
- **Semantic Logic:** Standardized Success/Error/Warning colors are used for inventory statuses (In Stock, Delayed, Out of Stock).

## Typography

The system utilizes the **Roboto** family for its mechanical efficiency and high legibility in data-dense environments.

- **Base Size:** As requested, the standard content size is **13px**. This allows for significantly higher data density in tables and sidebars compared to the standard 16px.
- **Hierarchy:** We use weight (Medium 500 and Bold 700) rather than large jumps in scale to differentiate information. This keeps the UI compact.
- **Numerical Data:** For tracking numbers, SKU codes, and currency, the system suggests a monospaced variant or tabular figures to ensure numbers align vertically in tables.

## Layout & Spacing

The layout utilizes a **Fixed Sidebar + Fluid Content** model. 

- **Grid:** A 12-column fluid grid system is used for the main dashboard area. Widgets typically span 3, 4, 6, or 12 columns.
- **Density:** We employ a tight spacing rhythm based on a 4px baseline. Padding in data tables is minimized (8px vertical) to maximize the "above the fold" information.
- **Sidebar:** The navigation is persistent on the left. It can be collapsed to an icon-only view to grant more horizontal space for wide data tables.
- **Responsive Behavior:** On tablet, the 12-column grid collapses to 6. On mobile, all widgets stack vertically (12 columns), and the sidebar transitions to a bottom navigation bar or a hamburger-triggered drawer.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Soft Ambient Shadows**.

- **Level 0 (Background):** The base floor of the application.
- **Level 1 (Cards/Widgets):** Elevated with a subtle 1px border (`#E2E8F0` in light, `#334155` in dark) and a very soft, diffused shadow (`0px 4px 12px rgba(0,0,0,0.05)`).
- **Level 2 (Modals/Dropdowns):** Higher elevation with a more pronounced shadow to indicate temporary overlay status.
- **Interaction:** Hover states on interactive rows or cards use a subtle background tint shift rather than a shadow increase, maintaining a "flat" professional profile.

## Shapes

The design system uses a **Soft (0.25rem)** roundedness philosophy. 

- **Standard Elements:** Buttons, input fields, and small tags use a 4px (`rounded`) corner radius. This strikes a balance between the "engineered" feel of sharp corners and the modern feel of fully rounded UI.
- **Large Containers:** Dashboard widgets and main content cards use an 8px (`rounded-lg`) radius to frame data sections clearly.
- **Status Badges:** Use a fully pill-shaped radius to differentiate them from interactive buttons.

## Components

- **Dense Tables:** The core of the system. Rows have a hover state highlight. Text within cells uses `body-base` for primary data and `body-sm` for metadata (e.g., a sub-heading under a Product Name).
- **Status Badges:** Compact labels with a subtle background tint and high-contrast text. Example: "In Transit" uses a light blue background with dark blue text.
- **Dashboard Widgets:** Each widget must have a consistent header (Title + Icon Action). Metrics are displayed in `display-lg` for immediate impact.
- **Multi-step Forms:** Progress is tracked via a thin stepper at the top of the form. Inputs use a 1px border that thickens and changes to the Primary Teal on focus.
- **Buttons:**
    - *Primary:* Solid Teal background, white text.
    - *Secondary:* Ghost style with a 1px Blue border and Blue text.
    - *Tertiary:* Text-only for low-priority actions like "Cancel."
- **Charts:** Use a coordinated palette of 5 distinct blues/teals to ensure multi-series data is distinguishable even in dark mode.