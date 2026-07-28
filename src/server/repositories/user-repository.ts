import { eq, and, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users, type Role } from "@/lib/db/schema";

export type NewUser = {
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

  async create(input: NewUser) {
    const db = getDb();
    const [user] = await db
      .insert(users)
      .values({
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
};
