import { eq, and, desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { courses, courseContentItems, subjects, classes, type ContentItemType } from "@/lib/db/schema";

export const CourseRepository = {
  async listByTeacher(teacherId: string) {
    const db = getDb();
    return db
      .select({ course: courses, subjectName: subjects.name, className: classes.name, classSection: classes.section })
      .from(courses)
      .innerJoin(subjects, eq(courses.subjectId, subjects.id))
      .leftJoin(classes, eq(courses.classId, classes.id))
      .where(eq(courses.teacherId, teacherId))
      .orderBy(desc(courses.createdAt));
  },

  async listPublishedForClass(classId: string) {
    const db = getDb();
    return db
      .select({ course: courses, subjectName: subjects.name })
      .from(courses)
      .innerJoin(subjects, eq(courses.subjectId, subjects.id))
      .where(and(eq(courses.classId, classId), eq(courses.isPublished, true)))
      .orderBy(desc(courses.createdAt));
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return row ?? null;
  },

  async create(input: {
    title: string;
    description?: string;
    subjectId: string;
    classId?: string;
    teacherId: string;
    academicYearId: string;
    isPublished?: boolean;
  }) {
    const db = getDb();
    const [row] = await db.insert(courses).values(input).returning();
    return row;
  },

  async listContentItems(courseId: string) {
    const db = getDb();
    return db
      .select()
      .from(courseContentItems)
      .where(eq(courseContentItems.courseId, courseId))
      .orderBy(courseContentItems.orderIndex);
  },

  async publish(id: string) {
    const db = getDb();
    await db.update(courses).set({ isPublished: true, updatedAt: new Date() }).where(eq(courses.id, id));
  },

  async createContentItem(input: {
    courseId: string;
    themeId: string;
    title: string;
    type: ContentItemType;
    r2Key?: string;
    bodyMarkdown?: string;
    externalUrl?: string;
    orderIndex?: number;
    durationSeconds?: number;
  }) {
    const db = getDb();
    const [row] = await db.insert(courseContentItems).values(input).returning();
    return row;
  },
};
