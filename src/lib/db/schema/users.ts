import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps, softDelete } from "./_shared";

export const ROLES = ["admin", "teacher", "student", "parent"] as const;
export type Role = (typeof ROLES)[number];

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().$type<Role>(),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
});

/**
 * Session tokens: only the SHA-256 hash of the raw cookie token is ever
 * stored here — see RFC 0001 "Auth Design". Raw token never touches the DB.
 */
export const sessions = pgTable("sessions", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});
