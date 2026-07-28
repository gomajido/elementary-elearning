import { eq, and, isNull } from "drizzle-orm";

import { getDb, type Queryable } from "@/lib/db";
import { users, type Role } from "@/lib/db/schema";

export type NewUser = {
  id?: string;
  email: string;
  passwordHash: string;
  role: Role;
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

  async findById(id: string) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return user ?? null;
  },

  async countByRole(role: Role) {
    const db = getDb();
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, role));
    return rows.length;
  },

  /** Pass `tx` (from `db.transaction(async (tx) => ...)`) to compose atomic multi-table writes. */
  async create(input: NewUser, tx: Queryable = getDb()) {
    const [user] = await tx
      .insert(users)
      .values({
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
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
};
