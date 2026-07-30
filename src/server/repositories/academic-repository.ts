import { eq, desc, isNull, and } from "drizzle-orm";

import { getDb, type Queryable } from "@/lib/db";
import { academicYears, subjects, classes, teachers, teacherSubjectAssignments } from "@/lib/db/schema";
import { alias } from "drizzle-orm/pg-core";

export const AcademicYearRepository = {
  async list() {
    const db = getDb();
    return db.select().from(academicYears).where(isNull(academicYears.deletedAt)).orderBy(desc(academicYears.startDate));
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.id, id), isNull(academicYears.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(input: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) {
    const db = getDb();
    const [row] = await db.insert(academicYears).values(input).returning();
    return row;
  },

  async update(id: string, input: Partial<{ name: string; startDate: string; endDate: string; isCurrent: boolean }>, tx: Queryable = getDb()) {
    const [row] = await tx
      .update(academicYears)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(academicYears.id, id))
      .returning();
    return row;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(academicYears).set({ deletedAt: new Date() }).where(eq(academicYears.id, id));
  },

  async unsetCurrent() {
    const db = getDb();
    await db.update(academicYears).set({ isCurrent: false });
  },
};

export const SubjectRepository = {
  async list() {
    const db = getDb();
    return db.select().from(subjects).where(isNull(subjects.deletedAt)).orderBy(subjects.name);
  },

  async create(input: { name: string; code?: string }) {
    const db = getDb();
    const [row] = await db.insert(subjects).values(input).returning();
    return row;
  },

  async update(id: string, input: Partial<{ name: string; code: string }>, tx: Queryable = getDb()) {
    const [row] = await tx
      .update(subjects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(subjects.id, id))
      .returning();
    return row;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(subjects).set({ deletedAt: new Date() }).where(eq(subjects.id, id));
  },
};

export const ClassRepository = {
  async list() {
    const db = getDb();
    return db
      .select()
      .from(classes)
      .where(isNull(classes.deletedAt))
      .orderBy(classes.gradeLevel, classes.section);
  },

  async listByAcademicYear(academicYearId: string) {
    const db = getDb();
    return db
      .select()
      .from(classes)
      .where(and(eq(classes.academicYearId, academicYearId), isNull(classes.deletedAt)))
      .orderBy(classes.gradeLevel, classes.section);
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, id), isNull(classes.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async listByClassTeacher(classTeacherId: string) {
    const db = getDb();
    return db
      .select()
      .from(classes)
      .where(and(eq(classes.classTeacherId, classTeacherId), isNull(classes.deletedAt)))
      .orderBy(classes.gradeLevel, classes.section);
  },

  async create(input: {
    name: string;
    section?: string;
    gradeLevel: number;
    academicYearId: string;
    classTeacherId?: string;
    capacity?: number;
  }) {
    const db = getDb();
    const [row] = await db.insert(classes).values(input).returning();
    return row;
  },

  async update(
    id: string,
    input: Partial<{
      name: string;
      section: string | null;
      gradeLevel: number;
      academicYearId: string;
      classTeacherId: string | null;
      capacity: number | null;
    }>,
    tx: Queryable = getDb(),
  ) {
    const [row] = await tx
      .update(classes)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return row;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(classes).set({ deletedAt: new Date() }).where(eq(classes.id, id));
  },

  async listWithDetails() {
    const db = getDb();
    return db
      .select({
        class: classes,
        academicYearName: academicYears.name,
        classTeacherFirstName: teachers.firstName,
        classTeacherLastName: teachers.lastName,
      })
      .from(classes)
      .innerJoin(academicYears, eq(classes.academicYearId, academicYears.id))
      .leftJoin(teachers, eq(classes.classTeacherId, teachers.id))
      .where(isNull(classes.deletedAt))
      .orderBy(classes.gradeLevel, classes.section);
  },
};

export const TeacherSubjectAssignmentRepository = {
  async listByClass(classId: string) {
    const db = getDb();
    return db.select().from(teacherSubjectAssignments).where(eq(teacherSubjectAssignments.classId, classId));
  },

  async create(input: { teacherId: string; classId: string; subjectId: string; academicYearId: string }) {
    const db = getDb();
    const [row] = await db.insert(teacherSubjectAssignments).values(input).returning();
    return row;
  },

  async listAllWithDetails() {
    const db = getDb();
    const cls = alias(classes, "cls");
    return db
      .select({
        assignment: teacherSubjectAssignments,
        teacherFirstName: teachers.firstName,
        teacherLastName: teachers.lastName,
        className: cls.name,
        classSection: cls.section,
        subjectName: subjects.name,
      })
      .from(teacherSubjectAssignments)
      .innerJoin(teachers, eq(teacherSubjectAssignments.teacherId, teachers.id))
      .innerJoin(cls, eq(teacherSubjectAssignments.classId, cls.id))
      .innerJoin(subjects, eq(teacherSubjectAssignments.subjectId, subjects.id))
      .where(and(isNull(teachers.deletedAt), isNull(cls.deletedAt), isNull(subjects.deletedAt)));
  },
};
