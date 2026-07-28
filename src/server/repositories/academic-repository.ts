import { eq, desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { academicYears, subjects, classes, teachers, teacherSubjectAssignments } from "@/lib/db/schema";
import { alias } from "drizzle-orm/sqlite-core";

export const AcademicYearRepository = {
  async list() {
    const db = getDb();
    return db.select().from(academicYears).orderBy(desc(academicYears.startDate));
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(academicYears).where(eq(academicYears.id, id)).limit(1);
    return row ?? null;
  },

  async create(input: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) {
    const db = getDb();
    const [row] = await db.insert(academicYears).values(input).returning();
    return row;
  },

  async unsetCurrent() {
    const db = getDb();
    await db.update(academicYears).set({ isCurrent: false });
  },
};

export const SubjectRepository = {
  async list() {
    const db = getDb();
    return db.select().from(subjects).orderBy(subjects.name);
  },

  async create(input: { name: string; code?: string }) {
    const db = getDb();
    const [row] = await db.insert(subjects).values(input).returning();
    return row;
  },
};

export const ClassRepository = {
  async list() {
    const db = getDb();
    return db
      .select()
      .from(classes)
      .orderBy(classes.gradeLevel, classes.section);
  },

  async listByAcademicYear(academicYearId: string) {
    const db = getDb();
    return db
      .select()
      .from(classes)
      .where(eq(classes.academicYearId, academicYearId))
      .orderBy(classes.gradeLevel, classes.section);
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
    return row ?? null;
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
      .innerJoin(subjects, eq(teacherSubjectAssignments.subjectId, subjects.id));
  },
};
