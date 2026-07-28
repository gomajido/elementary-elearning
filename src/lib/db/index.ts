import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

// Module-level singleton — avoid opening a new connection pool per request.
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export function getDb() {
  return db;
}

export type Db = typeof db;

/**
 * The subset of `Db` every repository write needs — satisfied by both the
 * top-level `db` and the `tx` passed into `db.transaction(async (tx) => ...)`.
 * Repository methods take this (defaulting to `getDb()`) so services can
 * compose atomic multi-table writes with a real transaction instead of
 * D1's `db.batch()` — see RFC 0002.
 */
export type Queryable = Pick<Db, "insert" | "update" | "select" | "delete">;
