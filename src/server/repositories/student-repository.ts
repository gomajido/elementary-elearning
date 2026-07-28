import { eq, isNull, and } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { students, guardians, studentGuardians, enrollments, classes } from "@/lib/db/schema";

export type NewStudent = {
  id?: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  currentClassId?: string;
  enrollmentDate: string;
};

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

  async create(input: NewStudent) {
    const [row] = await StudentRepository.insertStatement(input);
    return row;
  },

  /** Unexecuted insert statement for `db.batch([...])` composition. */
  insertStatement(input: NewStudent) {
    const db = getDb();
    return db.insert(students).values(input).returning();
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
      .where(eq(studentGuardians.studentId, studentId));
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

export type NewStudentGuardianLink = {
  id?: string;
  studentId: string;
  guardianId: string;
  isPrimaryContact?: boolean;
  isBillingContact?: boolean;
};

export const GuardianRepository = {
  async create(input: NewGuardian) {
    const [row] = await GuardianRepository.insertStatement(input);
    return row;
  },

  insertStatement(input: NewGuardian) {
    const db = getDb();
    return db.insert(guardians).values(input).returning();
  },

  async linkToStudent(input: NewStudentGuardianLink) {
    const [row] = await GuardianRepository.linkInsertStatement(input);
    return row;
  },

  linkInsertStatement(input: NewStudentGuardianLink) {
    const db = getDb();
    return db.insert(studentGuardians).values(input).returning();
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
  async create(input: NewEnrollment) {
    const [row] = await EnrollmentRepository.insertStatement(input);
    return row;
  },

  insertStatement(input: NewEnrollment) {
    const db = getDb();
    return db.insert(enrollments).values(input).returning();
  },
};
