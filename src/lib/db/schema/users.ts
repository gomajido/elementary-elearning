import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

import { id, schoolId, timestamps, softDelete } from "./_shared";

export const ROLES = ["admin", "teacher", "student", "parent"] as const;
export type Role = (typeof ROLES)[number];

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().$type<Role>(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(false),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
});

/**
 * Session tokens: only the SHA-256 hash of the raw cookie token is ever
 * stored here — see RFC 0001 "Auth Design". Raw token never touches the DB.
 */
export const sessions = sqliteTable("sessions", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
