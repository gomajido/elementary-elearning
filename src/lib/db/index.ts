import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import * as schema from "./schema";

/**
 * Under Cloudflare Workers, Hyperdrive's connection string comes from a
 * request-scoped binding (`env.HYPERDRIVE.connectionString`), not
 * `process.env` — unlike plain string secrets (S3_*, UPSTASH_*), which
 * OpenNext does shim into `process.env`, Hyperdrive is an object binding
 * with no such shim. Importing `getCloudflareContext` itself is inert (no
 * Workers/Next.js context needed just to load the module) — only *calling*
 * it requires a real Cloudflare context, which plain Node/Bun scripts
 * (scripts/seed.ts) and vitest don't have, so that call is what's wrapped
 * in try/catch, not the import. See RFC 0004's "spike" — confirmed
 * empirically, not assumed.
 */
function resolveConnectionString(): string {
  try {
    const { env } = getCloudflareContext();
    const connectionString = (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE?.connectionString;
    if (connectionString) return connectionString;
  } catch {
    // Not running under Workers/OpenNext — fall through to plain env var.
  }
  return process.env.DATABASE_URL!;
}

// Same call shape as the old eager `const db = drizzle(client, { schema })`
// — kept as its own function purely so `Db` can still be inferred from a
// real call expression (`ReturnType<typeof createDb>`) rather than a
// hand-written generic instantiation, which drizzle's overloads don't
// resolve identically.
function createDb(client: postgres.Sql) {
  return drizzle(client, { schema });
}
export type Db = ReturnType<typeof createDb>;

// Lazy singleton, not created at module load: in Workers, bindings aren't
// available until a request comes in, so the connection can't be opened at
// import time the way local dev's always could.
let db: Db | null = null;

export function getDb(): Db {
  if (!db) {
    db = createDb(postgres(resolveConnectionString()));
  }
  return db;
}

/**
 * The subset of `Db` every repository write needs — satisfied by both the
 * top-level `db` and the `tx` passed into `db.transaction(async (tx) => ...)`.
 * Repository methods take this (defaulting to `getDb()`) so services can
 * compose atomic multi-table writes with a real transaction instead of
 * D1's `db.batch()` — see RFC 0002.
 */
export type Queryable = Pick<Db, "insert" | "update" | "select" | "delete">;
