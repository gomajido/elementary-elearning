# RFC 0004: Production deployment on Cloudflare, free storage/DB/cache

- **Status**: Deployed and verified end-to-end on a branch (`deploy/cloudflare-workers`, not merged to main yet) — live at `https://elearning.abd-majidehamide.workers.dev` against real Neon (migrated), real R2, real Upstash. CPU-time/PBKDF2 measurement (Free vs. Paid Workers) still open.
- **Date**: 2026-08-04
- **Author**: Abdul Majid Hamid (with Claude Code)
- **Amends**: RFC 0001, RFC 0002

## Context

RFC 0001 originally targeted Cloudflare Workers + D1. RFC 0002 dropped D1 for Postgres and, in doing so, deliberately removed all Cloudflare-specific deployment tooling (`@opennextjs/cloudflare`, `wrangler`, `wrangler.jsonc`) — at the time, the deploy target was left open on purpose. We're now picking Cloudflare back up as that target, but on the current stack (Postgres, S3-compatible storage, Redis cache), not D1. The requirement driving the choices below: **storage, Postgres, and Redis must run on $0 tiers.** Everything here was verified against current (August 2026) provider docs, not assumed from training data, since free-tier limits and Workers' Node-compat capabilities have moved a lot over the past two years.

**None of these are unconditionally free** — each is free *up to a cap*, and what happens past that cap differs per provider (see each section). This app's realistic scale (small single school, no video content wired up — see RFC 0003's seed script for the shape of the data) should stay under all three for years, but "free tier" here means "free within these limits," not "free regardless of usage."

## Decisions

### Storage → Cloudflare R2 — no code change

`src/lib/storage/client.ts` is already generic S3 (`@aws-sdk/client-s3`, per RFC 0002) — R2 is S3-compatible, so this is a credentials swap, not a code change. Free allowance: **10 GB storage, 1M Class A (write) ops/month, 10M Class B (read) ops/month, zero egress fees.** This app has no video/PDF course content wired up yet (RFC 0001 open item) — current usage is small (avatars, payment-proof photos/PDFs) and comfortably fits under 10 GB for a long time.

**This is the one with a real ongoing cost risk**: R2 doesn't block or suspend past the free allowance — it bills automatically, **$0.015/GB-month over 10 GB** (storage) plus per-operation overage rates past the 1M/10M op caps. If usage grows past the free allowance, it's a small, predictable bill, not a surprise cutoff — but unlike Neon below, there's no free built-in circuit breaker. Worth setting a Cloudflare billing alert once this is live.

**Setup**: create an R2 bucket, mint an R2 API token (S3-compatible access key/secret), set `S3_ENDPOINT`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`/`S3_BUCKET` to the R2 values (`S3_FORCE_PATH_STYLE` and `S3_REGION` stay as they are).

### Database → Neon (free) behind Cloudflare Hyperdrive (free)

Workers don't get a clean, low-friction path to arbitrary Postgres without Hyperdrive — it's the officially-supported route (connection pooling + query caching, **zero egress charge**, and Cloudflare made it free-plan-eligible in April 2025). It's a pooling/caching proxy in front of Postgres, not a database itself, so we still need a Postgres host: **Neon's free tier** (0.5 GB storage/project, 100 compute-hours/month, scales to zero after 5 min idle — a permanent free tier, not a trial).

- `postgres` (the driver this app already uses via `drizzle-orm/postgres-js`) ships a **workerd-specific conditional export** — it's designed to run inside Workers already, no driver swap needed. It does need `serverExternalPackages: ["postgres"]` added to `next.config.ts` so Next doesn't bundle it with Node's module resolution instead of workerd's.
- `wrangler.jsonc` needs `compatibility_flags: ["nodejs_compat"]`, a recent `compatibility_date`, and a `hyperdrive` binding pointing at a Hyperdrive config created from Neon's connection string.
- Free-plan Hyperdrive caps at **100,000 queries/day** (unlimited on Workers Paid) — ample for a single small school.
- **Spike resolved** (was an open question, now confirmed): `process.env.DATABASE_URL` does *not* just work under Workers. OpenNext's `process.env` shim only covers plain string secrets (`S3_*`, `UPSTASH_*`) — Hyperdrive is an object binding (`env.HYPERDRIVE.connectionString`), which needs `getCloudflareContext()` (from `@opennextjs/cloudflare`) to reach at all, and that's only available inside a request, not at module load. `getDb()` was rewritten: the connection is now a lazy singleton (created on first call, not at import time), and `resolveConnectionString()` tries `getCloudflareContext().env.HYPERDRIVE.connectionString` first, falling back to plain `process.env.DATABASE_URL` when there's no Cloudflare context at all — which is also what makes `scripts/seed.ts` (a plain Bun script, never touches Next.js/Workers) keep working unchanged. Verified directly: a standalone script import of `getDb()` still queries local Docker Postgres correctly through the fallback path.
- **Migrations run outside the Worker**: `drizzle-kit migrate` needs Postgres DDL access, which is a bad fit for a pooling proxy meant for app-runtime queries. Point `DATABASE_URL` at Neon's **direct** connection string (not through Hyperdrive) for `bun run db:migrate`, run from CI or a local machine — same command, different target, same discipline RFC 0001/0002 already established (inspect the generated diff before applying).

**Watch item**: Neon's 0.5 GB/project cap is the tightest free-tier number in this whole plan. A single small elementary school's data (the kind of scale this app's own seed script models — see RFC 0003) should fit for years, but this is worth checking periodically, not a "set and forget." Unlike R2, Neon **fails safe on cost**: hitting the storage or compute-hour cap **suspends the project** until the next billing cycle (or a manual upgrade) — no surprise bill, but the app goes down until you act.

### Cache → Upstash Redis (free), via `@upstash/redis`, not `ioredis`

This is the one place a real driver swap is needed. `ioredis` speaks the raw Redis TCP protocol; Workers *can* open raw TCP sockets (the `connect()` API), and there's community proof it works for Redis specifically — but Cloudflare has no Hyperdrive-equivalent for Redis to handle pooling/reconnection for you, and it's a rougher, less-supported path (open compatibility issues on `ioredis`'s own tracker). Upstash — the free Redis-as-a-service option here — offers **both** a TCP endpoint and an **HTTP/REST API purpose-built for edge/serverless runtimes**, which is what `@upstash/redis` speaks. No TCP socket handling, no connection pooling to think about, officially the recommended pairing for Workers.

`src/lib/cache/redis.ts` needs its `getRedisClient()`/`cached()` internals rewritten against `@upstash/redis`'s `get`/`set`-with-TTL calls — the exported `cached<T>(key, ttlSeconds, compute)` signature and its fail-open-on-error behavior stay identical, so nothing calling it (`AnalyticsService`, per the Redis-cached dashboard feature) changes.

Free allowance: **256 MB data, 500K commands/month, 10 GB bandwidth, up to 10 databases** — this app's only cache use today is a low-frequency analytics-dashboard cache-aside, nowhere near that ceiling. Overage behavior on a database left on the free plan isn't precisely documented (Upstash's own docs mostly describe budgets/overage for databases already moved to pay-as-you-go) — confirm at signup rather than assume; it does not appear to auto-bill a free-plan database the way R2 does.

**Setup**: create an Upstash Redis database, take its REST URL + token, set them as Worker secrets (replaces `REDIS_URL`).

### Compute → Cloudflare Workers, Paid plan ($5/mo) recommended — the one line item not free

Your ask scoped "must be free" to storage/Postgres/Redis specifically, so this is called out as a separate, overridable call: the Workers **Free** plan caps CPU time at **10ms per invocation**. That's wall-clock-cheap I/O (DB/cache round-trips) excluded — only active JS execution counts — but this app's password hashing (`src/lib/auth/password.ts`, PBKDF2 at 210,000 iterations, deliberately expensive to resist brute force) is pure CPU work on every login and every account-creation, and is a realistic candidate to blow a 10ms budget on its own. I'm not asserting it definitely will — that needs measuring, not guessing — but going in assuming the Free compute plan works without checking would be the kind of thing that quietly breaks login in production. Workers **Paid** ($5/month minimum, 10M requests + 30M CPU-ms included) removes this risk entirely and is cheap enough that I'd default to it unless you want to test the Free plan's real headroom first.

### Explicitly out of scope here

Not "storage/Postgres/Redis," so not decided in this RFC, but still blocking a full production cutover:
- **WAHA** (self-hosted WhatsApp HTTP API) needs its own always-on host — not a Workers-shaped workload, and not free anywhere it'd need to run 24/7 for a persisted WhatsApp session.
- **SMTP relay** — Mailpit is dev-only. Needs a real relay (several have workable free tiers) before email reminders/notifications work in prod.
- Domain/DNS, Worker secrets management, CI deploy pipeline.

## Setup checklist

1. ✅ Re-add `@opennextjs/cloudflare` + `wrangler` — via `opennextjs-cloudflare migrate`, which scaffolded `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars`, `public/_headers`, and the `preview`/`deploy`/`upload`/`cf-typegen` package.json scripts.
2. ✅ `next.config.ts`: `serverExternalPackages: ["postgres"]` added.
3. ✅ Neon project created; Hyperdrive config created (`wrangler hyperdrive create`) and bound in `wrangler.jsonc`.
4. ✅ R2 bucket (`madani`, app content) + API token created. A second bucket (`elearning-opennext-cache`) is also required — OpenNext's own incremental-cache layer, unrelated to app storage, bound in `wrangler.jsonc`'s `r2_buckets`.
5. ✅ Upstash Redis database created; `src/lib/cache/redis.ts` rewritten against `@upstash/redis` (done in an earlier pass, see git history).
6. ✅ `getDb()` rewritten for the Hyperdrive-binding-vs-`process.env` split (see Decisions above) — verified against both the local-dev fallback path *and* the real deployed Hyperdrive→Neon path (see Verification #2).
7. ✅ Migrations run directly against Neon's connection string (`.env.production`'s `DATABASE_URL` already is the direct string, confirmed correct by construction) — `bun run db:migrate` applied all 28 tables to Neon successfully.
8. ✅ `wrangler secret put` done for R2 keys + Upstash REST creds (8 secrets). `DATABASE_URL` deliberately **not** pushed as a Worker secret — the deployed Worker always has a Cloudflare context, so `getDb()` always takes the Hyperdrive path; the plain-env fallback exists only for contexts with no Cloudflare context at all (local dev, `scripts/seed.ts`).
9. ✅ Deployed via `bun run deploy` — live at `https://elearning.abd-majidehamide.workers.dev`.

## Verification

1. ✅ Confirmed `getCloudflareContext()` is safely inert outside a Cloudflare context: `getDb()` called from a standalone `bun run` script (no Next.js, no Workers) correctly falls through to `process.env.DATABASE_URL` and queries local Postgres successfully.
2. ✅ Confirmed against the **real deployed Worker**, not just local emulation: first deploy's `/setup` incorrectly showed "admin already exists" — traced to a real, separate bug (see below), fixed, redeployed, then correctly showed the genuine bootstrap-admin form against Neon (migrated, freshly empty of admins). Full chain confirmed live: Worker → `getCloudflareContext()` → Hyperdrive binding → real Neon → Drizzle → correct query result.
3. **Real bug found and fixed via this deploy**: `src/app/(public)/setup/page.tsx` has no `cookies()`/`headers()` touch (unlike every protected page, which gets dynamic rendering for free via `requireRole()` reading the session cookie), so Next.js's static analysis didn't detect it as dynamic and **prerendered it once at build time** — the deployed Worker was serving a static HTML snapshot baked from local dev's DB state (which had an admin) regardless of Neon's real, empty state. Fixed with `export const dynamic = "force-dynamic"`. Cross-checked the rest of the route tree against the build's route-type output (`○` static vs `ƒ` dynamic) — every other page needing live data was already correctly dynamic via layout-level `requireRole()` cascading; `/setup` was the only gap (`/` and `/login` are static by design, correctly so — no per-request data needed).
4. Not yet done: measure real CPU-ms for a login request (PBKDF2 hash+verify) under the real deployed Worker — decide Free-vs-Paid compute with a number, not a guess.
5. Not yet done: full role-chain smoke test against the deployed Worker (admin → teacher → student → parent) — only `/setup` has been exercised live so far.
6. Not yet done: confirm R2 upload/download round-trip (payment proof, avatar) against real R2, not just MinIO.
7. ✅ Confirmed `cached()` fails open correctly when Upstash is unreachable, and that a cache hit correctly skips recomputation with values round-tripping intact through `@upstash/redis`'s automatic (de)serialization.

## Amendments

Future architectural changes are appended as new numbered RFCs (`0005-...`), per RFC 0001's convention.

Sources consulted (August 2026): [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Cloudflare Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/), [Hyperdrive connect-to-Postgres example](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/), [Cloudflare Hyperdrive free plan changelog](https://developers.cloudflare.com/changelog/post/2025-04-08-hyperdrive-free-plan), [Neon free tier FAQ](https://github.com/neondatabase/website/blob/main/content/faqs/managed-postgres-databases-free-tier.md), [Upstash Redis pricing](https://upstash.com/docs/redis/overall/pricing), [Upstash: Redis at the Edge with Cloudflare Workers](https://upstash.com/blog/redis-cloudflare-workers), [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), [OpenNext Cloudflare workerd how-to (TCP packages)](https://opennext.js.org/cloudflare/howtos/workerd), [OpenNext Cloudflare get-started](https://opennext.js.org/cloudflare/get-started), [Cloudflare `connect()` TCP socket API announcement](https://blog.cloudflare.com/workers-tcp-socket-api-connect-databases/).
