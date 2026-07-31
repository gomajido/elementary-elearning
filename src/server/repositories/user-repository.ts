import { eq, and, or, asc, isNull } from "drizzle-orm";

import { getDb, type Queryable } from "@/lib/db";
import { users, type Role } from "@/lib/db/schema";

export type NewUser = {
  id?: string;
  email?: string | null;
  username?: string | null;
  passwordHash: string;
  /** roles[0] is the primary role — see users.ts schema comment. */
  roles: Role[];
  mustChangePassword?: boolean;
};

export const UserRepository = {
  async findByEmail(email: string) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);
    return user ?? null;
  },

  /** All non-null emails currently in use — for bulk-import uniqueness pre-checks (avoids one query per CSV row). */
  async listEmails() {
    const db = getDb();
    const rows = await db.select({ email: users.email }).from(users).where(isNull(users.deletedAt));
    return rows.map((r) => r.email).filter((e): e is string => e !== null);
  },

  async findByUsername(username: string) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);
    return user ?? null;
  },

  /** Login lookup: accepts email, username, or (for teachers) NIP — see auth-service.ts login(). */
  async findByIdentifier(identifier: string) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(or(eq(users.email, identifier), eq(users.username, identifier)), isNull(users.deletedAt)))
      .limit(1);
    return user ?? null;
  },

  async findById(id: string) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return user ?? null;
  },

  /** Counts accounts whose *primary* role (roles[0]) is `role` — used for the "does a real admin exist" bootstrap check. */
  async countByRole(role: Role) {
    const db = getDb();
    const rows = await db.select({ roles: users.roles }).from(users);
    return rows.filter((r) => r.roles[0] === role).length;
  },

  /** Every account across all roles, for the admin account-management page. */
  async listAll() {
    const db = getDb();
    return db.select().from(users).where(isNull(users.deletedAt)).orderBy(asc(users.createdAt));
  },

  /** Pass `tx` (from `db.transaction(async (tx) => ...)`) to compose atomic multi-table writes. */
  async create(input: NewUser, tx: Queryable = getDb()) {
    const [user] = await tx
      .insert(users)
      .values({
        id: input.id,
        email: input.email,
        username: input.username,
        passwordHash: input.passwordHash,
        roles: input.roles,
        mustChangePassword: input.mustChangePassword ?? false,
      })
      .returning();
    return user;
  },

  async updateLastLoginAt(id: string) {
    const db = getDb();
    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
  },

  async updatePassword(id: string, passwordHash: string) {
    const db = getDb();
    await db
      .update(users)
      .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  },

  async updateUsername(id: string, username: string) {
    const db = getDb();
    await db.update(users).set({ username, updatedAt: new Date() }).where(eq(users.id, id));
  },

  /** Admin-forced reset (vs. updatePassword's self-service reset) — flips mustChangePassword back on. */
  async resetPassword(id: string, passwordHash: string) {
    const db = getDb();
    await db
      .update(users)
      .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
      .where(eq(users.id, id));
  },

  async updateRoles(id: string, roles: Role[]) {
    const db = getDb();
    await db.update(users).set({ roles, updatedAt: new Date() }).where(eq(users.id, id));
  },

  async updateIdentity(id: string, input: { email: string | null; username: string | null }) {
    const db = getDb();
    await db
      .update(users)
      .set({ email: input.email, username: input.username, updatedAt: new Date() })
      .where(eq(users.id, id));
  },
};
