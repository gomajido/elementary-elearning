"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { AssignmentService, AssignmentError } from "@/server/services/assignment-service";
import { CourseService, CourseError } from "@/server/services/course-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { presignUpload } from "@/lib/storage/client";
import { isAllowedAssignmentAttachmentContentType } from "@/lib/uploads";

/** `ok` distinguishes a successful submit from the initial (unsubmitted) state, so dialogs can close themselves. */
export type ActionState = { error?: string; ok?: boolean };

const assignmentSchema = z.object({
  courseId: z.string().min(1),
  themeId: z.string().min(1),
  title: z.string().min(1),
  instructions: z.string().optional(),
  dueDate: z.string().min(1),
  maxScore: z.coerce.number().int().positive(),
  allowLateSubmission: z.coerce.boolean().optional(),
  attachmentR2Key: z.string().optional(),
});

export async function createAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = assignmentSchema.safeParse({
    courseId: formData.get("courseId"),
    themeId: formData.get("themeId"),
    title: formData.get("title"),
    instructions: formData.get("instructions") || undefined,
    dueDate: formData.get("dueDate"),
    maxScore: formData.get("maxScore"),
    allowLateSubmission: formData.get("allowLateSubmission") === "on",
    attachmentR2Key: formData.get("attachmentR2Key") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await AssignmentService.createAssignment({ teacherUserId: user.id, ...parsed.data });
  } catch (err) {
    if (err instanceof AssignmentError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/teacher/courses/${parsed.data.courseId}`);
  return { ok: true };
}

export async function requestAssignmentAttachmentUploadUrlAction(courseId: string, contentType: string) {
  const user = await requireRole(["teacher"]);
  try {
    await CourseService.assertTeacherOwnsCourse(user.id, courseId);
  } catch (err) {
    if (err instanceof CourseError) throw new Error(err.message);
    throw err;
  }
  if (!isAllowedAssignmentAttachmentContentType(contentType)) throw new Error("Jenis file tidak didukung");

  const key = `assignment-attachments/${courseId}/${crypto.randomUUID()}`;
  const uploadUrl = await presignUpload(key, contentType);
  return { uploadUrl, key };
}

const submitSchema = z.object({
  assignmentId: z.string().min(1),
  textResponse: z.string().optional(),
  attachmentR2Key: z.string().optional(),
});

export async function submitAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["student"]);
  const parsed = submitSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    textResponse: formData.get("textResponse") || undefined,
    attachmentR2Key: formData.get("attachmentR2Key") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  const student = await StudentRepository.findByUserId(user.id);
  if (!student) return { error: "Tidak ada data siswa untuk akun ini" };

  try {
    await AssignmentService.submit({
      assignmentId: parsed.data.assignmentId,
      studentId: student.id,
      textResponse: parsed.data.textResponse,
      attachmentR2Key: parsed.data.attachmentR2Key,
    });
  } catch (err) {
    if (err instanceof AssignmentError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/student/assignments/${parsed.data.assignmentId}`);
  return {};
}

export async function requestSubmissionAttachmentUploadUrlAction(assignmentId: string, contentType: string) {
  const user = await requireRole(["student"]);
  const student = await StudentRepository.findByUserId(user.id);
  if (!student) throw new Error("Tidak ada data siswa untuk akun ini");
  if (!isAllowedAssignmentAttachmentContentType(contentType)) throw new Error("Jenis file tidak didukung");

  const key = `submission-attachments/${assignmentId}/${student.id}/${crypto.randomUUID()}`;
  const uploadUrl = await presignUpload(key, contentType);
  return { uploadUrl, key };
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    const { assignmentId } = await AssignmentService.gradeSubmission({ teacherUserId: user.id, ...parsed.data });
    revalidatePath(`/teacher/assignments/${assignmentId}`);
  } catch (err) {
    if (err instanceof AssignmentError) return { error: err.message };
    throw err;
  }

  return {};
}
