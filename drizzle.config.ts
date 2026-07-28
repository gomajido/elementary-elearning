import { defineConfig } from "drizzle-kit";

// Migrations are generated here (`bun run db:generate`) but applied via
// `wrangler d1 migrations apply` (local then remote), not `drizzle-kit
// migrate` — see RFC 0001 "Key Risks / Gotchas". No D1 credentials needed
// for generate; this dialect/schema/out config is all `generate` uses.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle/migrations",
});
