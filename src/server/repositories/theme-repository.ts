import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { themes, courseContentItems, assignments, quizzes } from "@/lib/db/schema";

export const ThemeRepository = {
  async listByCourse(courseId: string) {
    const db = getDb();
    return db
      .select()
      .from(themes)
      .where(and(eq(themes.courseId, courseId), isNull(themes.deletedAt)))
      .orderBy(themes.orderIndex);
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.id, id), isNull(themes.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(input: { courseId: string; title: string; orderIndex: number }) {
    const db = getDb();
    const [row] = await db.insert(themes).values(input).returning();
    return row;
  },

  async updateTitle(id: string, title: string) {
    const db = getDb();
    await db.update(themes).set({ title, updatedAt: new Date() }).where(eq(themes.id, id));
  },

  async softDelete(id: string) {
    const db = getDb();
    await db.update(themes).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(themes.id, id));
  },

  /** Live (non-deleted) children, so a Bab holding content can't be hidden out from under it. */
  async countChildren(themeId: string) {
    const db = getDb();
    const [row] = await db
      .select({
        contentItems: sql<number>`(select count(*) from ${courseContentItems} where ${courseContentItems.themeId} = ${themeId} and ${courseContentItems.deletedAt} is null)`,
        assignments: sql<number>`(select count(*) from ${assignments} where ${assignments.themeId} = ${themeId} and ${assignments.deletedAt} is null)`,
        quizzes: sql<number>`(select count(*) from ${quizzes} where ${quizzes.themeId} = ${themeId} and ${quizzes.deletedAt} is null)`,
      })
      .from(themes)
      .where(eq(themes.id, themeId))
      .limit(1);
    return {
      contentItems: Number(row?.contentItems ?? 0),
      assignments: Number(row?.assignments ?? 0),
      quizzes: Number(row?.quizzes ?? 0),
    };
  },

  /**
   * Swaps orderIndex with the adjacent sibling. Two Bab can briefly share an
   * index mid-swap, so both writes go in one transaction.
   */
  async swapOrder(a: { id: string; orderIndex: number }, b: { id: string; orderIndex: number }) {
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.update(themes).set({ orderIndex: b.orderIndex, updatedAt: new Date() }).where(eq(themes.id, a.id));
      await tx.update(themes).set({ orderIndex: a.orderIndex, updatedAt: new Date() }).where(eq(themes.id, b.id));
    });
  },
};
