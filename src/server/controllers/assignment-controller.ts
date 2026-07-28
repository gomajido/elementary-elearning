"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { AssignmentService, AssignmentError } from "@/server/services/assignment-service";
import { StudentRepository } from "@/server/repositories/student-repository";

export type ActionState = { error?: string };

const assignmentSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  instructions: z.string().optional(),
  dueDate: z.string().min(1),
  maxScore: z.coerce.number().int().positive(),
  allowLateSubmission: z.coerce.boolean().optional(),
});

export async function createAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = assignmentSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    instructions: formData.get("instructions") || undefined,
    dueDate: formData.get("dueDate"),
    maxScore: formData.get("maxScore"),
    allowLateSubmission: formData.get("allowLateSubmission") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await AssignmentService.createAssignment({ teacherUserId: user.id, ...parsed.data });
  } catch (err) {
    if (err instanceof AssignmentError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/teacher/courses/${parsed.data.courseId}`);
  return {};
}

const submitSchema = z.object({
  assignmentId: z.string().min(1),
  textResponse: z.string().optional(),
});

export async function submitAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["student"]);
  const parsed = submitSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    textResponse: formData.get("textResponse") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const student = await StudentRepository.findByUserId(user.id);
  if (!student) return { error: "No student record for this account" };

  try {
    await AssignmentService.submit({
      assignmentId: parsed.data.assignmentId,
      studentId: student.id,
      textResponse: parsed.data.textResponse,
    });
  } catch (err) {
    if (err instanceof AssignmentError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/student/assignments/${parsed.data.assignmentId}`);
  return {};
}

const gradeSchema = z.object({
  submissionId: z.string().min(1),
  score: z.coerce.number().int().min(0),
  feedback: z.string().optional(),
});

export async function gradeSubmissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = gradeSchema.safeParse({
    submissionId: formData.get("submissionId"),
    score: formData.get("score"),
    feedback: formData.get("feedback") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const { assignmentId } = await AssignmentService.gradeSubmission({ teacherUserId: user.id, ...parsed.data });
    revalidatePath(`/teacher/assignments/${assignmentId}`);
  } catch (err) {
    if (err instanceof AssignmentError) return { error: err.message };
    throw err;
  }

  return {};
}
