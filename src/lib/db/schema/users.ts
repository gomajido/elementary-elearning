import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps, softDelete } from "./_shared";

export const ROLES = ["admin", "teacher", "student", "parent"] as const;
export type Role = (typeof ROLES)[number];

export const users = pgTable("users", {
  id: id(),
  email: text("email").unique(),
  // Alternate login identifier for accounts without email: NIP for
  // teachers (mirrors teachers.employeeNumber), system-generated for
  // students/guardians who don't have one. See RFC-less design note in
  // auth-service.ts login().
  username: text("username").unique(),
  passwordHash: text("password_hash").notNull(),
  // Every role this user has. roles[0] is the "primary" role — set once at
  // creation, decides the default post-login landing page (ROLE_HOME) and
  // gates who may grant/revoke further roles (see requireBaseRole in
  // rbac.ts). Later entries are additive grants (e.g. a teacher granted
  // admin access becomes ["teacher", "admin"]) — see AuthService.grantAdmin.
  roles: text("roles").array().notNull().$type<Role[]>(),
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
