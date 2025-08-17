# Comprehensive Style Guide — Gantt SaaS (Dark Mode–First)

> This style guide consolidates best practices from modern design systems and adapts them to our product’s dark, data‑dense Gantt UI. It defines **tokens, foundations, components, content, accessibility, and governance** so designers and engineers ship consistent work fast.

---

## 0) Scope & Principles

**Scope:** This document is the **product style guide** (visual + interaction + content). It references our UX guidelines (`ux_guides.md`) for behavior patterns and serves as the ground truth for design tokens and component specs.

**Design Principles**

- Clarity over decoration
- Data density with legibility
- Progressive disclosure over clutter
- Accessibility by default
- Performance & responsiveness
- Opinionated defaults, configurable where it matters

---

## 1) Design Tokens

Tokens are the smallest reusable decisions. They live in code (CSS variables and Tailwind config) and in the Figma library. Never hard‑code raw values; use tokens.

### 1.1 Token Naming

- **Prefix by category**: `--color-*`, `--space-*`, `--radius-*`, `--elev-*`, `--z-*`, `--font-*`, `--duration-*`, `--easing-*`.
- **Semantic > raw**: prefer `--color-bg-surface` over `--color-#111827`.
- **Modes**: tokens define roles; **themes** map roles to values (dark/light/contrast).

### 1.2 Color Tokens (Dark baseline)

**Brand**

- `--color-brand`: #2563EB
- `--color-brand-600`: #2563EB
- `--color-brand-700`: #1D4ED8
- `--color-brand-400`: #60A5FA

**Surfaces**

- `--color-bg-app`: #111827 /_ app background _/
- `--color-bg-surface`: #1F2937 /_ panels, cards _/
- `--color-bg-raised`: #0B1220 /_ popovers, menus _/

**Borders & Lines**

- `--color-border`: #374151
- `--color-grid-subtle`: #1B2432
- `--color-grid-strong`: #223049

**Text**

- `--color-text-primary`: #E5E7EB
- `--color-text-secondary`: #9CA3AF
- `--color-text-inverse`: #0B1220
- `--color-link`: #93C5FD

**States**

- `--color-info`: #3B82F6
- `--color-success`: #10B981
- `--color-warning`: #F59E0B
- `--color-danger`: #EF4444

**Gantt Bars**

- `--gantt-blue`: #3B82F6 /_ default _/
- `--gantt-purple`: #8B5CF6 /_ theme/group _/
- `--gantt-pink`: #EC4899 /_ critical/special _/
- `--gantt-ghost`: #31415B /_ drag preview _/
- `--gantt-progress-overlay`: rgba(255,255,255,0.18)

**Today Marker**

- `--color-today-line`: #F87171

> _Light and high‑contrast themes map the same roles to different values._

### 1.3 Typography Tokens

- `--font-sans`: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"
- Scale (rem):
    - `--font-size-xxs`: 0.75rem (12px)
    - `--font-size-xs`: 0.8125rem (13px)
    - `--font-size-sm`: 0.875rem (14px)
    - `--font-size-md`: 1rem (16px)
    - `--font-size-lg`: 1.125rem (18px)
    - `--font-size-xl`: 1.5rem (24px)

- Weights: 400 regular, 500 medium, 600 semibold
- Line-height defaults: 1.45 body, 1.2 headings
- Letterspacing: normal for body; tighten slightly on headings if needed

### 1.4 Spacing Tokens (8‑pt base)

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px

Use for padding, gaps, and layout rhythm. Prefer fewer unique spacings per screen.

### 1.5 Radius, Elevation, and Z‑index

- Radius: `--radius-2`: 4px; `--radius-3`: 6px; `--radius-4`: 8px; `--radius-pill`: 9999px
- Elevation (shadows in dark mode are low‑alpha, color‑tinted):
    - `--elev-1`: 0 1px 2px rgba(0,0,0,0.35)
    - `--elev-2`: 0 2px 6px rgba(0,0,0,0.4)
    - `--elev-3`: 0 8px 24px rgba(0,0,0,0.45)
- Z‑index scale: `--z-base`: 0; `--z-raised`: 10; `--z-overlay`: 1000; `--z-modal`: 1200; `--z-toast`: 1400

### 1.6 Motion Tokens

- Durations: `--duration-fast`: 120ms; `--duration-base`: 200ms; `--duration-slow`: 300ms
- Easing: `--ease-standard`: cubic-bezier(0.2, 0, 0, 1); `--ease-emphasized`: cubic-bezier(0.2, 0, 0, 1.2)
- Use reduced‑motion media query to disable nonessential animation.

### 1.7 Data‑viz Tokens (Gantt)

- Row height: `--gantt-row`: 30px
- Bar height: `--gantt-bar`: 24px
- Bar radius: `--gantt-radius`: 6px
- Dependency stroke: `--gantt-dep-stroke`: 2px; `--gantt-dep-color`: #9CA3AF

---

## 2) Layout & Grid

- **Breakpoints**: `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`
- **Columns**: 12‑column fluid grid on desktop. Panels are fixed min‑width with the timeline consuming remaining space.
- **Density**: Aim for 14–16px base text with 24–32px vertical rhythm.
- **Safe areas**: Respect macOS/Win title bars and browser UI; no interactive controls flush to the screen edge.
- **Scrolling**: Vertical in sidebars; horizontal for timeline with kinetic scroll.

---

## 3) Color Usage Rules

- Avoid conveying meaning with color alone. Pair status colors with icons, labels, or patterns.
- Dark surfaces stack: app (darker) → panels (lighter) → overlays (lightest) to imply elevation.
- Gradients are allowed for Gantt bars at rest only if contrast stays AA for inner text.
- Today marker is always visible above bars.
- Ensure contrast: text vs. its background ≥ 4.5:1; small UI strokes ≥ 3:1.

**Semantic Color Mapping**

- Info → `--color-info`; Success → `--color-success`; Warning → `--color-warning`; Danger → `--color-danger`.
- Interactive: default `--color-brand`, hover `--color-brand-700`, focus ring `outline: 2px solid var(--color-brand-400)`.

---

## 4) Typography Rules

- Use **Inter** (or platform sans fallbacks).
- Headings: sentence case. Avoid ALL CAPS.
- Numbers in Gantt labels use tabular numerals if available for alignment.
- Truncate long task names with ellipsis; reveal full text in tooltip.
- Contrast for small text (≤12px) must be AA Large equivalent: avoid tiny gray on gray.

---

## 5) Iconography & Imagery

- Icon set: line icons (Lucide/Heroicons) on a 24px grid; default stroke 1.5px–2px.
- Sizes: 16px (inline), 20–24px (toolbar).
- Never rely on a single glyph for meaning; include text labels or tooltips for lesser‑known actions.
- Imagery: keep minimal. Use simple empty‑state illustrations with muted palettes on dark surfaces.

---

## 6) Motion & Interaction

- Hover: subtle elevation or brightness +4%.
- Focus (keyboard): 2px focus ring with 1px offset, high‑contrast color.
- Drag & Drop: show a ghost bar (`--gantt-ghost`) and snap to grid on drop.
- Entrance/exit: panel slide 200–240ms; toasts fade 160–200ms.
- Respect `prefers-reduced-motion`.

---

## 7) Components (Core Specs)

### 7.1 Buttons

- **Primary**: brand fill, white text, radius 8px; hover darken; focus ring visible on dark surfaces.
- **Secondary**: transparent w/ 1px border; hover adds subtle bg (`--color-bg-surface` + 3%).
- **Danger**: red fill; only for destructive/irreversible actions.
- Touch target ≥ 40x40px; disabled states at 40–50% opacity plus `not-allowed` cursor where appropriate.

### 7.2 Inputs & Forms

- Fields: dark surface, 1px border `--color-border`, focus ring brand‑400.
- Labels: 12–14px secondary text; inline help beneath fields.
- Validation:
    - Error border `--color-danger`, helper text explains how to fix.
    - Success optional; prefer quiet confirmation.
- Date pickers honor “skip weekends” preference and local timezone.
- Inline destructive actions must confirm (dialog or undo pattern).

### 7.3 Panels & Drawers

- Use `--elev-2` or higher. Dismiss via Esc, overlay click, or explicit close.
- Keep panel width 360–480px on desktop; full‑width sheet on mobile.

### 7.4 Toasters

- Location: top‑right on desktop, top on mobile.
- Variants: info/success/warning/danger with icon + concise text. Auto‑dismiss 4–6s, pausable on hover.

### 7.5 Data Table/List (Backlog & Staff)

- Row height 40–48px, zebra striping optional.
- “Add” actions are primary within their list region.
- Removal is secondary with confirm or undo.

### 7.6 Gantt Chart (Product‑specific)

- Row height `--gantt-row` (30px default).
- Bars: `--gantt-bar` height (24px), radius 6px, inner padding 6–8px.
- Labels: left‑aligned name; right‑aligned duration (e.g., “5d”).
- Progress: overlay using `--gantt-progress-overlay` from left to %.
- Dependencies: curved connectors, 2px stroke; on hover, highlight both ends; ensure connector contrast.
- Zoom: day/week/month presets with consistent column widths.
- Today: thin line `--color-today-line` above bars (z‑index overlay).
- Overflow: when multiple bars overlap, stack with 2px vertical separation or compress with “+n more” indicator.
- Selection: pressed state brightens bar and shows resize handles at ends.
- Keyboard:
    - Arrow up/down to move row focus
    - Arrow left/right to move time selection
    - Enter to open details
    - `Del` to delete (with confirm)

### 7.7 Share & Export

- Export CSV uses current filters and zoom. Indicate in filename: `<project>_<YYYY-MM-DD>_<view>.csv`.

---

## 8) Content: Voice, Tone & Microcopy

**Voice (always)**: clear, direct, professional.  
**Tone (adapts)**: calm for routine, concise and supportive for errors.

**Patterns**

- Primary actions use verbs: “Add task”, “Auto‑assign”, “Share”.
- Empty state: “No tasks yet. Add one to get started.”
- Error: “We couldn’t save your changes. Try again.” Include remediation.
- Duration: use `d` for days; avoid ambiguous abbreviations elsewhere.
- Capitalization: sentence case for UI; Title Case for page titles only.
- Tooltips: 1 short sentence; no punctuation unless multiple clauses.
- Alt text for icons when unlabeled (e.g., in toolbars).

**Naming**

- Avoid internal jargon.
- Use “task”, “bar”, “theme”, “assignee”. Pick one term and be consistent.

---

## 9) Accessibility

- **Contrast**: WCAG AA minimums (4.5:1 for text; 3:1 for large text/icons).
- **Focus**: visible focus ring on all interactive elements.
- **Keyboard**: all interactions available without a mouse; logical tab order.
- **Screen readers**: each Gantt bar exposes `name`, `assignee`, `start`, `end`, `progress`, and `status` via ARIA labels or descriptions.
- **Hit targets**: ≥ 40x40px.
- **Motion sensitivity**: honor `prefers-reduced-motion`.
- **Color independence**: pair color with icon, pattern, or text.
- **Localization**: date/time formats respect locale and timezone; support Monday/Sunday week start; consider RTL mirroring for timeline if we add RTL.

---

## 10) Theming (Light, Dark, High‑Contrast)

- Tokens define roles; themes map roles → values.
- Dark is default. Light inverts surfaces and adjusts text colors (no pure black on white to reduce glare).
- High‑contrast theme increases contrast and focus indicators, reduces translucency and shadow reliance.

---

## 11) Responsiveness & Mobile

- Sidebar collapses by default on small screens; bottom nav for quick sections.
- Timeline gestures: horizontal scroll; pinch to zoom; tap to open details. Limit drag‑edit on mobile—prefer editing in the detail sheet.
- Sticky Today control and zoom at the top of the timeline.
- Performance: virtualize rows and lazy‑render dependencies.

---

## 12) Engineering Hand‑off

**CSS Variables**

```css
:root {
    --color-bg-app: #111827;
    --color-bg-surface: #1f2937;
    --color-border: #374151;
    --color-text-primary: #e5e7eb;
    --color-brand: #2563eb;
    --space-2: 8px;
    --radius-4: 8px;
    --duration-base: 200ms;
}
.button--primary {
    background: var(--color-brand);
    color: var(--color-text-primary);
    border-radius: var(--radius-4);
    transition: background var(--duration-base) var(--ease-standard);
}
```

**Tailwind Mapping (example)**

```js
// tailwind.config.js (excerpt)
theme: {
  extend: {
    colors: {
      app: '#111827',
      surface: '#1F2937',
      brand: '#2563EB',
      text: { primary: '#E5E7EB', secondary: '#9CA3AF' }
    },
    borderRadius: { DEFAULT: '8px', lg: '12px' },
    spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px' }
  }
}
```

---

## 13) Governance, Versioning & Contribution

- **Source of truth**: tokens and components live in a monorepo package (`@gantt/design`), versioned with SemVer.
- **Changelogs**: human‑readable release notes; breaking changes flagged.
- **Contribution**: open PR with before/after screenshots, a11y impact, and migration notes.
- **“Do/Don’t” examples** required in docs for any new component.
- **Audit cadence**: quarterly review of accessibility, density, and performance.
- **Design QA checklist** (excerpt):
    - Contrast and focus states verified
    - Keyboard paths tested
    - Token use (no hard‑coded values)
    - Responsive behavior at sm/md/lg/xl
    - Motion honors reduced‑motion
    - Text truncation + tooltip behavior validated

---

## 14) Appendix: Component Status Matrix (initial)

| Component        | Status | A11y                  | Docs | Owner |
| ---------------- | ------ | --------------------- | ---- | ----- |
| Buttons          | ✅     | ✅                    | ✅   | UI    |
| Inputs           | ✅     | ⚠ Helper text review | ✅   | UI    |
| Drawer/Panel     | ✅     | ✅                    | ✅   | UI    |
| Toast            | ✅     | ✅                    | ✅   | UI    |
| Data List        | ✅     | ✅                    | ✅   | UI    |
| Date Picker      | 🚧     | TBD                   | 🚧   | UI    |
| Gantt Row & Bar  | ✅     | ✅                    | ✅   | Gantt |
| Dependency Lines | ✅     | ✅                    | ✅   | Gantt |

---

**This guide evolves.** Propose updates through PRs to `@gantt/design` with screenshots and token diffs.
