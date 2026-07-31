import { eq, isNull, and } from "drizzle-orm";

import { getDb, type Queryable } from "@/lib/db";
import { students, guardians, studentGuardians, enrollments, classes, type EnrollmentStatus, type Gender } from "@/lib/db/schema";

export type NewStudent = {
  id?: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  currentClassId?: string;
  enrollmentDate: string;
};

export type StudentUpdate = Partial<NewStudent> & { enrollmentStatus?: EnrollmentStatus };

export const StudentRepository = {
  async list() {
    const db = getDb();
    return db
      .select()
      .from(students)
      .where(isNull(students.deletedAt))
      .orderBy(students.lastName, students.firstName);
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByAdmissionNumber(admissionNumber: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(students)
      .where(and(eq(students.admissionNumber, admissionNumber), isNull(students.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByUserId(userId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(students)
      .where(and(eq(students.userId, userId), isNull(students.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(input: NewStudent, tx: Queryable = getDb()) {
    const [row] = await tx.insert(students).values(input).returning();
    return row;
  },

  async update(id: string, input: StudentUpdate, tx: Queryable = getDb()) {
    const [row] = await tx.update(students).set({ ...input, updatedAt: new Date() }).where(eq(students.id, id)).returning();
    return row;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(students).set({ deletedAt: new Date() }).where(eq(students.id, id));
  },

  async listWithDetails() {
    const db = getDb();
    return db
      .select({
        student: students,
        className: classes.name,
        classSection: classes.section,
      })
      .from(students)
      .leftJoin(classes, eq(students.currentClassId, classes.id))
      .where(isNull(students.deletedAt))
      .orderBy(students.lastName, students.firstName);
  },

  async linkUser(studentId: string, userId: string, tx: Queryable = getDb()) {
    await tx.update(students).set({ userId, updatedAt: new Date() }).where(eq(students.id, studentId));
  },

  async listByClass(classId: string) {
    const db = getDb();
    return db
      .select()
      .from(students)
      .where(and(eq(students.currentClassId, classId), isNull(students.deletedAt)))
      .orderBy(students.lastName, students.firstName);
  },

  async listGuardiansForStudent(studentId: string) {
    const db = getDb();
    return db
      .select({ guardian: guardians, link: studentGuardians })
      .from(studentGuardians)
      .innerJoin(guardians, eq(studentGuardians.guardianId, guardians.id))
      .where(and(eq(studentGuardians.studentId, studentId), isNull(guardians.deletedAt)));
  },
};

export type NewGuardian = {
  id?: string;
  firstName: string;
  lastName: string;
  relationshipType: "mother" | "father" | "guardian" | "other";
  phone?: string;
  email?: string;
  address?: string;
};

export type GuardianUpdate = Partial<Omit<NewGuardian, "id">>;

export type NewStudentGuardianLink = {
  id?: string;
  studentId: string;
  guardianId: string;
  isPrimaryContact?: boolean;
  isBillingContact?: boolean;
};

export const GuardianRepository = {
  async create(input: NewGuardian, tx: Queryable = getDb()) {
    const [row] = await tx.insert(guardians).values(input).returning();
    return row;
  },

  async linkToStudent(input: NewStudentGuardianLink, tx: Queryable = getDb()) {
    const [row] = await tx.insert(studentGuardians).values(input).returning();
    return row;
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(guardians)
      .where(and(eq(guardians.id, id), isNull(guardians.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByUserId(userId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(guardians)
      .where(and(eq(guardians.userId, userId), isNull(guardians.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async update(id: string, input: GuardianUpdate, tx: Queryable = getDb()) {
    const [row] = await tx
      .update(guardians)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(guardians.id, id))
      .returning();
    return row;
  },

  async softDelete(id: string, tx: Queryable = getDb()) {
    await tx.update(guardians).set({ deletedAt: new Date() }).where(eq(guardians.id, id));
  },

  /** All guardians, with their linked students' names (comma-joined-friendly array). */
  async listWithStudents() {
    const db = getDb();
    return db
      .select({ guardian: guardians, student: students })
      .from(guardians)
      .leftJoin(studentGuardians, eq(studentGuardians.guardianId, guardians.id))
      .leftJoin(students, eq(students.id, studentGuardians.studentId))
      .where(isNull(guardians.deletedAt))
      .orderBy(guardians.lastName, guardians.firstName);
  },

  async listChildrenForGuardian(guardianId: string) {
    const db = getDb();
    return db
      .select({ student: students })
      .from(studentGuardians)
      .innerJoin(students, eq(students.id, studentGuardians.studentId))
      .where(and(eq(studentGuardians.guardianId, guardianId), isNull(students.deletedAt)));
  },

  async linkUser(guardianId: string, userId: string, tx: Queryable = getDb()) {
    await tx.update(guardians).set({ userId, updatedAt: new Date() }).where(eq(guardians.id, guardianId));
  },
};

export type NewEnrollment = {
  id?: string;
  studentId: string;
  classId: string;
  academicYearId: string;
  enrolledAt: string;
};

export const EnrollmentRepository = {
  async create(input: NewEnrollment, tx: Queryable = getDb()) {
    const [row] = await tx.insert(enrollments).values(input).returning();
    return row;
  },

  /** Every enrollment row, school-wide — small table, aggregated in JS by the caller (see AnalyticsService). */
  async listAll() {
    const db = getDb();
    return db.select().from(enrollments);
  },
};
