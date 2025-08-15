# Repository Guidelines

## Project Structure & Module Organization
- Root app: `index.html`, `styles.css`, `app.js` (no build system).
- Sample data: `sample.csv` for CSV import testing.
- Static assets: screenshots and misc files live at repo root.
- State is stored in `localStorage` (no backend).

## Build, Test, and Development Commands
- Run locally (no build step):
  - macOS: `open index.html`
  - Simple server (recommended for CORS): `python3 -m http.server 8080`
  - Then visit: `http://localhost:8080/`
- Reset data during dev: click `Clear All` in the UI (clears localStorage state for this app).

## Coding Style & Naming Conventions
- JavaScript: 2‑space indent, semicolons, `const`/`let`, camelCase for variables/functions, small helpers near usage.
- HTML: semantic tags where possible; IDs match those read in `app.js` (e.g., `#backlog`, `#ganttBody`).
- CSS: use existing custom properties (e.g., `--cell-width`), prefer utility‑style additions over large rewrites; keep selectors shallow.
- Files: keep single‑purpose files (`app.js`, `styles.css`); name new assets in kebab‑case.

## Testing Guidelines
- No formal test framework configured. Perform quick manual checks:
  - Add/remove tasks and staff; drag tasks to rows and back to backlog.
  - Toggle weekends, change start date, adjust zoom.
  - Refresh to verify persistence via localStorage.
  - CSV import: use `sample.csv`; verify queued vs backlog placement.
- If adding tests, propose a lightweight plan (e.g., Playwright smoke tests) in your PR.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject; include scope when helpful (e.g., `ui: improve block styling`). Group related changes.
- PRs: include a clear description, before/after screenshots for UI changes, and steps to reproduce/test. Reference issues with `Fixes #NN`.
- Keep diffs focused; avoid unrelated formatting churn.

## Security & Configuration Tips
- CSV import is client‑side; avoid opening untrusted files while screen‑recording or sharing.
- Large CSVs run in the main thread; test performance before merging heavy changes.
- Do not introduce external network calls; this is a self‑contained static app.

