import { eq, and, isNull, isNotNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { assignments, assignmentSubmissions, students, courses, type SubmissionStatus } from "@/lib/db/schema";

export const AssignmentRepository = {
  async listByCourse(courseId: string) {
    const db = getDb();
    return db
      .select()
      .from(assignments)
      .where(and(eq(assignments.courseId, courseId), isNull(assignments.deletedAt)))
      .orderBy(assignments.dueDate);
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, id), isNull(assignments.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async update(
    id: string,
    input: {
      title: string;
      instructions?: string;
      dueDate: string;
      maxScore: number;
      allowLateSubmission?: boolean;
    },
  ) {
    const db = getDb();
    await db.update(assignments).set({ ...input, updatedAt: new Date() }).where(eq(assignments.id, id));
  },

  async softDelete(id: string) {
    const db = getDb();
    await db.update(assignments).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(assignments.id, id));
  },

  /** Submissions a student has actually turned in — a graded/submitted one blocks deletion. */
  async countSubmissions(assignmentId: string) {
    const db = getDb();
    const rows = await db
      .select({ id: assignmentSubmissions.id })
      .from(assignmentSubmissions)
      .where(and(eq(assignmentSubmissions.assignmentId, assignmentId), isNotNull(assignmentSubmissions.submittedAt)));
    return rows.length;
  },

  async create(input: {
    courseId: string;
    themeId: string;
    title: string;
    instructions?: string;
    dueDate: string;
    maxScore: number;
    allowLateSubmission?: boolean;
    attachmentR2Key?: string;
  }) {
    const db = getDb();
    const [row] = await db.insert(assignments).values(input).returning();
    return row;
  },
};

export const AssignmentSubmissionRepository = {
  async listForAssignment(assignmentId: string) {
    const db = getDb();
    return db
      .select({ submission: assignmentSubmissions, student: students })
      .from(assignmentSubmissions)
      .innerJoin(students, eq(assignmentSubmissions.studentId, students.id))
      .where(eq(assignmentSubmissions.assignmentId, assignmentId));
  },

  async findForStudent(assignmentId: string, studentId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(assignmentSubmissions)
      .where(and(eq(assignmentSubmissions.assignmentId, assignmentId), eq(assignmentSubmissions.studentId, studentId)))
      .limit(1);
    return row ?? null;
  },

  async listForStudent(studentId: string) {
    const db = getDb();
    return db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.studentId, studentId));
  },

  async listSubmissionsForCourse(courseId: string) {
    const db = getDb();
    return db
      .select({ submission: assignmentSubmissions, assignment: assignments, student: students })
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
      .innerJoin(students, eq(assignmentSubmissions.studentId, students.id))
      .where(and(eq(assignments.courseId, courseId), isNull(assignments.deletedAt)));
  },

  async listForStudentWithDetails(studentId: string) {
    const db = getDb();
    return db
      .select({
        submission: assignmentSubmissions,
        assignment: assignments,
        courseTitle: courses.title,
        subjectId: courses.subjectId,
        academicYearId: courses.academicYearId,
      })
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(and(eq(assignmentSubmissions.studentId, studentId), isNull(assignments.deletedAt)));
  },

  /** Every graded submission, school-wide, with its subject — for AnalyticsService.gradeSummary, no per-student/per-course filter. */
  async listAllGradedWithSubject() {
    const db = getDb();
    return db
      .select({ score: assignmentSubmissions.score, maxScore: assignments.maxScore, subjectId: courses.subjectId })
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(and(isNotNull(assignmentSubmissions.score), isNull(assignments.deletedAt)));
  },

  async upsertSubmission(input: {
    assignmentId: string;
    studentId: string;
    textResponse?: string;
    attachmentR2Key?: string;
    status: SubmissionStatus;
  }) {
    const db = getDb();
    const [row] = await db
      .insert(assignmentSubmissions)
      .values({ ...input, submittedAt: new Date() })
      .onConflictDoUpdate({
        target: [assignmentSubmissions.assignmentId, assignmentSubmissions.studentId],
        set: {
          textResponse: input.textResponse,
          attachmentR2Key: input.attachmentR2Key,
          status: input.status,
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  },

  async grade(submissionId: string, input: { score: number; feedback?: string; gradedByTeacherId: string }) {
    const db = getDb();
    await db
      .update(assignmentSubmissions)
      .set({
        score: input.score,
        feedback: input.feedback,
        gradedByTeacherId: input.gradedByTeacherId,
        gradedAt: new Date(),
        status: "graded",
        updatedAt: new Date(),
      })
      .where(eq(assignmentSubmissions.id, submissionId));
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.id, id)).limit(1);
    return row ?? null;
  },
};
