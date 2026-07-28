import { eq, lt } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export const SessionRepository = {
  async create(userId: string, tokenHash: string, meta?: { userAgent?: string; ipAddress?: string }) {
    const db = getDb();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        tokenHash,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      })
      .returning();
    return session;
  },

  async findByTokenHashWithUser(tokenHash: string) {
    const db = getDb();
    const [row] = await db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  },

  async deleteByTokenHash(tokenHash: string) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  },

  async deleteExpired() {
    const db = getDb();
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  },
};
