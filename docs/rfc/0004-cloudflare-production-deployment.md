# RFC 0004: Production deployment on Cloudflare, free storage/DB/cache

- **Status**: Proposed
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
- `getDb()` (`src/lib/db/index.ts`) currently reads `process.env.DATABASE_URL!` at module load. OpenNext's Cloudflare adapter shims Workers bindings into `process.env`, so this likely keeps working unchanged — **but this needs a real spike to confirm before committing to the full migration**, not an assumption (see Verification).
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

## Setup checklist (once this RFC is agreed)

1. Re-add `@opennextjs/cloudflare` + `wrangler`, `wrangler.jsonc` (`nodejs_compat`, `hyperdrive` binding).
2. `next.config.ts`: add `serverExternalPackages: ["postgres"]`.
3. Create Neon project (free) → Hyperdrive config bound to it.
4. Create R2 bucket + API token.
5. Create Upstash Redis database; rewrite `src/lib/cache/redis.ts` against `@upstash/redis`.
6. Point CI/local migrations at Neon's direct connection string, not Hyperdrive.
7. Provision Worker secrets for all of the above (never commit them).
8. Spike: confirm `getDb()`'s `process.env.DATABASE_URL` pattern actually resolves the Hyperdrive binding under OpenNext before treating the migration as done.

## Verification

1. Spike task first, in isolation: minimal Worker + OpenNext + Hyperdrive binding + `postgres` query, confirm it returns data before touching the full app.
2. Measure real CPU-ms for a login request (PBKDF2 hash+verify) and a representative admin SSR page under `wrangler dev --remote` or a deployed Worker — decide Free-vs-Paid compute with a number, not a guess.
3. Full role-chain smoke test against the deployed Worker (admin → teacher → student → parent), same golden-path discipline RFC 0001/0002 used.
4. Confirm R2 upload/download round-trip (payment proof, avatar) against real R2, not just MinIO.
5. Confirm `cached()` still fails open correctly if Upstash is unreachable (same contract as today's Redis fail-open).

## Amendments

Future architectural changes are appended as new numbered RFCs (`0005-...`), per RFC 0001's convention.

Sources consulted (August 2026): [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Cloudflare Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/), [Hyperdrive connect-to-Postgres example](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/), [Cloudflare Hyperdrive free plan changelog](https://developers.cloudflare.com/changelog/post/2025-04-08-hyperdrive-free-plan), [Neon free tier FAQ](https://github.com/neondatabase/website/blob/main/content/faqs/managed-postgres-databases-free-tier.md), [Upstash Redis pricing](https://upstash.com/docs/redis/overall/pricing), [Upstash: Redis at the Edge with Cloudflare Workers](https://upstash.com/blog/redis-cloudflare-workers), [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), [OpenNext Cloudflare workerd how-to (TCP packages)](https://opennext.js.org/cloudflare/howtos/workerd), [OpenNext Cloudflare get-started](https://opennext.js.org/cloudflare/get-started), [Cloudflare `connect()` TCP socket API announcement](https://blog.cloudflare.com/workers-tcp-socket-api-connect-databases/).
