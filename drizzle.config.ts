import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so nothing has loaded .env.local for us —
// without this every db:* script fails with "url: undefined" unless the caller
// exports DATABASE_URL by hand. An already-set DATABASE_URL still wins
// (loadEnvFile doesn't overwrite), so pointing the scripts at a different
// database stays a matter of prefixing the command.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
