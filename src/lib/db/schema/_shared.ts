import { text, integer } from "drizzle-orm/sqlite-core";

/**
 * Common columns every top-level table carries — see RFC 0001 "Core DB
 * Schema" conventions. `schoolId` defaults to a single value today but
 * exists on every table so a future multi-tenant conversion is a data
 * migration, not a schema rewrite.
 */
export const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const schoolId = () => text("school_id").notNull().default("default");

export const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
};

export const softDelete = {
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
};
