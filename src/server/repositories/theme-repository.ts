import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { themes } from "@/lib/db/schema";

export const ThemeRepository = {
  async listByCourse(courseId: string) {
    const db = getDb();
    return db.select().from(themes).where(eq(themes.courseId, courseId)).orderBy(themes.orderIndex);
  },

  async create(input: { courseId: string; title: string; orderIndex: number }) {
    const db = getDb();
    const [row] = await db.insert(themes).values(input).returning();
    return row;
  },
};
