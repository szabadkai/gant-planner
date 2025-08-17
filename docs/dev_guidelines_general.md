# Universal Development Guidelines

> Applies to **all** code in this repository (frontend, backend, scripts, infra). If another doc conflicts with this one, **this doc wins**.

## 1) Engineering Values

- **Correctness first**, then performance, then cleverness.
- **Small, reversible changes** over big-bang deliveries.
- **Typed boundaries** and **explicit contracts**.
- **Automate it once it hurts twice**.

## 2) Languages, Types & Style

- Prefer **TypeScript** for application code. Python/Go allowed for tooling/services with lead approval.
- Follow the repo’s shared linters/formatters: **ESLint**, **Prettier** (or `ruff/black` for Python, `gofmt` for Go).
- No unused code. No TODOs without an issue ID.

## 4) Testing Strategy

- **Pyramid**: unit > integration > e2e.
- Minimum coverage thresholds: **lines 80%**, **branches 70%** per package (don’t game it).
- Tests must be deterministic and runnable offline. Use **MSW**/**Nock** for HTTP, **sqlite/docker** for DB integration.
- Each bug fix must include a failing test.

## 6) Observability, Logging & Errors

- **Never swallow errors**. Return/throw structured errors with machine-friendly codes.
- Logs are structured (JSON) with `trace_id`, `span_id`, `user_id` (if available), and `severity`.
- Metrics: counter for success/error, histogram for latency; traces around IO.
- PII is never logged. Redact secrets by default.

## 7) Security & Privacy

- Secrets **never** in code/commits. Use the secret manager.
- Validate all inputs at boundaries. Deny by default.
- Keep dependencies patched; weekly update job with Renovate.
- License compliance: no copyleft in distributed builds without approval.

## 8) API & Contracts

- Contracts are source-of-truth (**OpenAPI/JSON Schema/Protobuf**). Code is generated from contracts where possible.
- Backwards compatibility: additive by default. Deprecate with warnings and dates.

## 9) Feature Flags & Config

- All risky changes behind flags. Flags are **short-lived**; remove after rollout.
- Config via environment variables; provide `.env.example`. No defaults that are unsafe in prod.

## 10) Performance & Budgets

- Define SLIs/SLOs per service. Regressions require a rollback or a plan.
- Budgets: page TTI, API p99 latency, memory per instance—documented per package.

## 11) Documentation

- Each package has a `README.md` with: purpose, quickstart, scripts, env vars, architecture diagram, and troubleshooting.
- ADRs for significant decisions (`/docs/adr/NNN-title.md`).

## 12) Ownership & On-call

- Every module lists **Owner(s)** in `CODEOWNERS`. On-call playbooks live in `/runbooks`.
