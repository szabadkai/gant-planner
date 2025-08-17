# Backend Development Guidelines

Applies to API services and workers. Preferred stack: **TypeScript** (Node 20+, Fastify/Nest), **PostgreSQL**, **Prisma or Knex**, **OpenAPI** for contracts, **BullMQ/Cloud queues** for async, **Jest/Vitest** for tests.

## 1) Architecture
- **Hexagonal**: domain logic isolated from transport (HTTP/queues/cron).
- Services expose interfaces; adapters implement persistence, HTTP, messaging.
- Keep controllers thin → validate → call use case → map result → respond.

## 2) API Design
- **Contract-first** with OpenAPI. Generate server types & clients for frontend.
- **Versioning**: `/v1` path; additive changes preferred. Deprecate with headers + docs.
- **Errors**: Problem Details (`application/problem+json`) with `type`, `title`, `status`, `code`, `traceId`.

## 3) Validation & Security
- Validate all inputs with **zod/yup** (or framework validators). Reject early.
- Auth: OAuth/OIDC or signed tokens; rotate keys; short-lived access tokens, long-lived refresh.
- **RBAC** at the service layer; never trust UI flags.
- Rate limiting on sensitive endpoints. CSRF protection for cookie-based auth.
- Sanitize outputs to avoid header injection; set strict security headers.

## 4) Persistence
- **PostgreSQL** default. Migrations are versioned and reviewed; no drift.
- Use **UUID v7** for ids. Timestamps are **UTC** with timezone stored when needed.
- Transactions for multi-write operations. Retries on transient errors with backoff.

## 5) Caching
- Layered caching: per-request (in-memory), application (LRU), distributed (Redis).
- Explicit TTLs. Invalidate on write; don’t serve stale sensitive data.
- Avoid cache snowball with jittered expirations.

## 6) Observability
- Structured logs (JSON). Include `trace_id`, `user_id`, `org_id` where applicable.
- Metrics: request count, latency histograms, error rate, queue depth, job success/fail.
- Tracing: instrument HTTP, DB, and external calls (OpenTelemetry).

## 7) Performance & Resilience
- Timeouts on all IO. Circuit breakers for flaky dependencies.
- Pooled DB connections sized to instance.
- p95/p99 latency SLOs documented; load test critical endpoints.
- Idempotency keys for POST endpoints that create resources.

## 8) Background Jobs & Scheduling
- Jobs are **idempotent** and **retryable** with exponential backoff.
- Dead-letter queues monitored with alerts and dashboards.
- Long-running tasks report heartbeat/percent complete.

## 9) Testing
- Unit tests for domain logic; integration tests with a **real Postgres** (docker) and HTTP.
- Contract tests against generated OpenAPI clients.
- Seed data via factories; tests parallelizable.

## 10) Error Handling
- Never throw raw errors across boundaries; use typed error classes with codes.
- Map internal errors to user-safe messages; include correlation ids.
- 5xx errors alert on-call when thresholds exceeded.

## 11) Security Hygiene
- Static analysis & dependency scanning in CI. Block builds on critical CVEs.
- Secrets from the secret manager; rotate regularly. No local `.env` in CI.
- Backups: daily snapshots with restore drills quarterly.

## 12) Delivery
- Blue/green or rolling deploys. Health checks for readiness/liveness.
- Migrations run as separate step; backward-compatible first, then cleanup.
- Feature flags for risky backend behavior (e.g., new scheduler).

## 13) Data Governance
- PII cataloged and minimized. Encryption at rest and in transit.
- Data retention policies enforced; delete on request (GDPR/CCPA ready).
