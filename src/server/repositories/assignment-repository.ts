import { eq, and } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { assignments, assignmentSubmissions, students, courses, type SubmissionStatus } from "@/lib/db/schema";

export const AssignmentRepository = {
  async listByCourse(courseId: string) {
    const db = getDb();
    return db.select().from(assignments).where(eq(assignments.courseId, courseId)).orderBy(assignments.dueDate);
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
    return row ?? null;
  },

  async create(input: {
    courseId: string;
    title: string;
    instructions?: string;
    dueDate: string;
    maxScore: number;
    allowLateSubmission?: boolean;
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
      .where(eq(assignments.courseId, courseId));
  },

  async listForStudentWithDetails(studentId: string) {
    const db = getDb();
    return db
      .select({ submission: assignmentSubmissions, assignment: assignments, courseTitle: courses.title })
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(assignmentSubmissions.studentId, studentId));
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
