# React Frontend Development Guidelines

Targets **React 18+** with **TypeScript**. Preferred toolchain: **Vite**, **React Router**, **TanStack Query**, **Zustand or Redux Toolkit**, **TailwindCSS**, **Zod** for validation, **MSW** for mocks, **Vitest/Jest** + **Testing Library**.

## 1) Architecture
- **Feature-first** folder structure:
  - `features/<name>/components`, `features/<name>/api`, `features/<name>/state`, `features/<name>/routes`
  - Shared primitives in `shared/` (UI, hooks, utils); avoid a massive `utils/` dump.
- **Data fetching** via TanStack Query. **No ad-hoc fetch** in components.
- **State**:
  - Server state → Query.
  - UI/ephemeral state → component state.
  - Cross-feature client state → Zustand/Redux (keep it small).
- **Routing**: lazy load route chunks; preserve scroll; guard private routes.

## 2) Components
- Prefer **pure, presentational components** + thin containers.
- Props are **typed** and **documented**. Optional props must have safe defaults.
- Limit files to a single component. Keep components ≤ 200–300 lines.
- Use **composition over inheritance**; pass render props or children for custom content.

## 3) Styling & Theming
- Tailwind for layout and spacing. Extract repeated patterns into **UI primitives** (e.g., Button, Input, Card).
- Dark mode is default. Use CSS variables for tokens; Tailwind maps tokens in `tailwind.config.js`.
- No inline magic numbers; use spacing/radius tokens.

## 4) Accessibility
- All interactive elements keyboard reachable; visible focus.
- Use semantic elements first; ARIA as enhancement.
- Gantt bars expose `aria-label` with name, assignee, start/end, progress.
- Test with keyboard-only and screen reader on critical flows.

## 5) Data & Validation
- Type server responses with **zod schemas**; parse at the boundary.
- Never trust route params or query strings; validate before use.

## 6) Performance
- Avoid re-renders: memoize pure components, use `useCallback`/`useMemo` thoughtfully.
- **Virtualize** long lists (e.g., task list) and Gantt rows.
- Code-split by route and large feature.
- Use **React Profiler** to spot wasted renders.

## 7) State & Side Effects
- Side effects belong in hooks (`useEffect`/custom hooks) not render.
- Cancel in-flight requests on unmount via Query or AbortController.
- Keep global stores serializable. No functions in Redux state.

## 8) Testing
- Unit test components with **Testing Library**; assert on behavior, not implementation.
- Snapshot only for **pure presentational** components.
- Integration tests for data flows (Query + UI). E2E via Playwright for critical journeys.

## 9) Error Handling
- Error boundaries at the **app** level and per **route group**.
- Show actionable messages; provide retry for fetch failures.
- Report errors with context (route, user id, trace id).

## 10) Internationalization
- Strings centralized; default English. Avoid string concatenation; use templates with variables.
- Dates/times via `Intl` respecting locale and timezone.

## 11) Gantt-Specific
- Bar geometry calculations isolated in a pure module (`gantt/geometry.ts`).
- Time scale utilities are framework-agnostic and unit-tested.
- Dependency lines rendered in a separate layer; throttle pointer events.

## 12) Tooling
- Lint rules: `react-hooks`, `jsx-a11y`, unescaped entities, exhaustive-deps.
- Storybook for primitives and complex components (Gantt bar, dependency line).

