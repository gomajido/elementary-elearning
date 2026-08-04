import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import * as schema from "./schema";

// fetch_types: false is Cloudflare's own documented requirement for
// postgres-js behind Hyperdrive — without it, postgres-js queries
// pg_catalog for custom type OIDs on connect, which doesn't work reliably
// through Hyperdrive's pooling proxy (caught live: login worked, but a
// joined students+classes query failed). max: 5 matches Cloudflare's
// example. Harmless for local dev's direct connection too, so applied
// unconditionally rather than branching on which path resolved.
const POSTGRES_OPTIONS = { max: 5, fetch_types: false } as const;

// Same call shape as the old eager `const db = drizzle(client, { schema })`
// — kept as its own function purely so `Db` can still be inferred from a
// real call expression (`ReturnType<typeof createDb>`) rather than a
// hand-written generic instantiation, which drizzle's overloads don't
// resolve identically.
function createDb(client: postgres.Sql) {
  return drizzle(client, { schema });
}
export type Db = ReturnType<typeof createDb>;

// Local dev / plain scripts (scripts/seed.ts, vitest — no Cloudflare
// context) reuse one long-lived connection across calls, same as any
// normal Node process would.
let localDb: Db | null = null;

export function getDb(): Db {
  try {
    const { env } = getCloudflareContext();
    const connectionString = (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE?.connectionString;
    if (connectionString) {
      // Under Workers: a fresh client every call, never cached across
      // requests. Hyperdrive already pools warm connections on the edge —
      // that's its whole purpose — so this is cheap. Caching a client at
      // module scope instead risks reusing a connection that went stale
      // during an idle gap between requests on the same isolate (caught
      // live: intermittent "Failed query" after a few idle minutes, gone
      // on immediate retry). Matches Cloudflare's own Hyperdrive example,
      // which creates the client inside the request handler, not as a
      // persistent singleton.
      return createDb(postgres(connectionString, POSTGRES_OPTIONS));
    }
  } catch {
    // Not running under Workers/OpenNext — fall through to the local path.
  }

  if (!localDb) {
    localDb = createDb(postgres(process.env.DATABASE_URL!, POSTGRES_OPTIONS));
  }
  return localDb;
}

/**
 * The subset of `Db` every repository write needs — satisfied by both the
 * top-level `db` and the `tx` passed into `db.transaction(async (tx) => ...)`.
 * Repository methods take this (defaulting to `getDb()`) so services can
 * compose atomic multi-table writes with a real transaction instead of
 * D1's `db.batch()` — see RFC 0002.
 */
export type Queryable = Pick<Db, "insert" | "update" | "select" | "delete">;
