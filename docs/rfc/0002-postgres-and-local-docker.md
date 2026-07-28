# RFC 0002: Swap Cloudflare D1 → Postgres, drop Workers-binding coupling

- **Status**: Accepted
- **Date**: 2026-07-28
- **Amends**: RFC 0001

## Context

RFC 0001 chose D1 + Cloudflare Workers for $0 hosting. All four roadmap phases were built and browser-verified on that stack. The data/storage layer is now made portable and not hard-coupled to Cloudflare's binding model: standard Postgres, runnable locally via Docker, deployable to any host. Cloudflare can still be used later — R2 is S3-compatible, and Postgres can be hosted on Neon's free tier — but the app no longer requires Workers-specific APIs (`getCloudflareContext()`, D1 bindings) to run.

This is a data-layer and tooling swap, not a UI/business-logic rewrite. Every page, service, and controller kept its shape. The coupling was well-contained before this change: only `src/lib/db/index.ts` and `src/lib/r2/client.ts` called `getCloudflareContext()`, and all 25+ repositories already went through a `getDb()` abstraction — that's exactly why the swap was tractable without touching business logic.

## Decisions

- **DB**: Postgres via `drizzle-orm/postgres-js` (the `postgres` npm package) + a `DATABASE_URL` env var. Works identically against local Docker Postgres and any hosted Postgres (Neon, Supabase, RDS, self-hosted) later.
- **Transactions**: D1's `db.batch([...unexecuted statements])` pattern — used for every atomic multi-table write (teacher/student/guardian registration, invoice+line-items, attendance register) — is replaced by real Postgres transactions: `db.transaction(async (tx) => {...})`. This is a genuine upgrade over D1's batch (real ACID, not a batch of independently-validated statements); RFC 0001's "D1 has no real multi-statement transactions" risk no longer applies. Attendance's whole-register save went further: Postgres supports a multi-row `INSERT ... ON CONFLICT`, so that write is now a single SQL statement (each row's update values come from its own proposed row via `excluded.*`) rather than a transaction of N statements.
- **Repository signature**: write methods that participate in a transaction take an optional trailing `tx` parameter typed `Queryable` (a minimal `Pick<Db, "insert"|"update"|"select"|"delete">`, exported from `src/lib/db/index.ts`), defaulting to `getDb()`. Services call `db.transaction(async (tx) => { await A.create(x, tx); await B.create(y, tx); })`. The old `insertStatement()`/`BatchItem` unexecuted-builder pattern is gone.
- **File storage**: `aws4fetch` replaced with `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (no longer Workers-bundle-size-constrained, so the standard SDK is fine and more idiomatic). Configured via generic `S3_ENDPOINT`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`/`S3_BUCKET`/`S3_REGION`/`S3_FORCE_PATH_STYLE` env vars — same code points at MinIO locally, R2 (S3-compatible), or real S3 in prod. Module moved from `src/lib/r2/` to `src/lib/storage/` since it's no longer R2-specific. (Still unwired to any UI — video/PDF content types and file attachments remain deferred per RFC 0001, now blocked only on wiring an upload component, not on infrastructure.)
- **Runtime**: standard Next.js (Node.js runtime). `@opennextjs/cloudflare`, `wrangler`, `wrangler.jsonc`, `open-next.config.ts`, `cloudflare-env.d.ts`, and the `cf:*` package.json scripts are removed. `next.config.ts` no longer calls `initOpenNextCloudflareForDev()`. Deployment target (Vercel/Fly/Railway/VPS/Docker, or revisiting Cloudflare Pages) is intentionally left open — out of scope for this change, which is about local portability and removing hard Cloudflare coupling, not picking a new host.
- **Local dev/test**: `docker-compose.yml` at the repo root runs Postgres 16 + MinIO (S3-compatible, stands in for R2/S3 locally) plus a one-shot `minio-init` service that creates the app bucket, so `docker compose up -d` alone is enough — no manual console click-through. `.env.example` documents `DATABASE_URL` and `S3_*` vars.
- **Migrations**: `drizzle-kit generate` (dialect: `postgresql`) + `drizzle-kit migrate` (connects via `DATABASE_URL`) — replaces the old `wrangler d1 migrations apply` two-step (`--local`/`--remote`).
- **Testing**: the ad hoc Playwright verification scripts used throughout RFC 0001's build are formalized into committed `tests/e2e/*.spec.ts` files (Playwright Test runner) covering the golden path per role, plus `vitest` unit tests for the pure-logic hot spots RFC 0001 flagged as highest-value (fee balance derivation, quiz short-answer normalization).

## Verification

1. `docker compose up -d` — Postgres + MinIO healthy, bucket auto-created.
2. `bun run db:generate && bun run db:migrate` — schema applied cleanly to local Postgres; inspected the generated SQL diff before applying (same migration-review discipline as RFC 0001, still good practice off D1). All 25 tables created with correct FKs and UNIQUE constraints (Postgres represents these as inline `CONSTRAINT ... UNIQUE(...)` rather than D1/SQLite's separate `CREATE UNIQUE INDEX` statements — functionally equivalent).
3. `bun run dev` — app boots on plain `next dev`, no Cloudflare context errors; landing page and `/setup` (first DB-backed request) both return 200.
4. `grep -rln "getCloudflareContext\|wrangler\|opennextjs" src/` — zero matches.
5. Full role-chain re-verified against Postgres (admin setup → teacher → student → grading → parent), confirming the transaction-based rewrites behave atomically and correctly — same checks as RFC 0001's phase-by-phase verification, now against the new stack.

## Amendments

Future architectural changes are appended as new numbered RFCs (`0003-...`), per RFC 0001's own convention.
