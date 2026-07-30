"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService, CourseError } from "@/server/services/course-service";
import { CONTENT_ITEM_TYPES } from "@/lib/db/schema";
import { presignUpload } from "@/lib/storage/client";

/** `success` distinguishes a successful submit from the initial (unsubmitted) state, so dialogs can close themselves. */
export type ActionState = { error?: string; success?: boolean };

const courseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  academicYearId: z.string().min(1),
});

export async function createCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    academicYearId: formData.get("academicYearId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await CourseService.createCourse({ teacherUserId: user.id, ...parsed.data });
  } catch (err) {
    if (err instanceof CourseError) return { error: err.message };
    throw err;
  }

  revalidatePath("/teacher/courses");
  return {};
}

export async function publishCourseAction(courseId: string) {
  const user = await requireRole(["teacher"]);
  await CourseService.publishCourse(user.id, courseId);
  revalidatePath(`/teacher/courses/${courseId}`);
}

const themeSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
});

export async function createThemeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = themeSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await CourseService.createTheme({ teacherUserId: user.id, ...parsed.data });
  } catch (err) {
    if (err instanceof CourseError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/teacher/courses/${parsed.data.courseId}`);
  return { success: true };
}

const renameThemeSchema = z.object({ themeId: z.string().min(1), title: z.string().min(1) });

export async function renameThemeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = renameThemeSchema.safeParse({
    themeId: formData.get("themeId"),
    title: formData.get("title"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    const theme = await CourseService.renameTheme({ teacherUserId: user.id, ...parsed.data });
    revalidatePath(`/teacher/courses/${theme.courseId}`);
  } catch (err) {
    if (err instanceof CourseError) return { error: err.message };
    throw err;
  }

  return { success: true };
}

/**
 * Deletes run off a button, not a form, so they return the reason rather
 * than throwing: Next.js redacts thrown Server Action messages in
 * production, which would turn "Bab ini masih berisi 2 materi" into a
 * generic error.
 */
export async function deleteThemeAction(themeId: string): Promise<{ error?: string }> {
  const user = await requireRole(["teacher"]);
  try {
    const theme = await CourseService.deleteTheme({ teacherUserId: user.id, themeId });
    revalidatePath(`/teacher/courses/${theme.courseId}`);
    return {};
  } catch (err) {
    if (err instanceof CourseError) return { error: err.message };
    throw err;
  }
}

export async function moveThemeAction(themeId: string, direction: "up" | "down") {
  const user = await requireRole(["teacher"]);
  const theme = await CourseService.moveTheme({ teacherUserId: user.id, themeId, direction });
  revalidatePath(`/teacher/courses/${theme.courseId}`);
}

const updateContentItemSchema = z.object({
  contentItemId: z.string().min(1),
  title: z.string().min(1),
  bodyMarkdown: z.string().optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
});

export async function updateContentItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = updateContentItemSchema.safeParse({
    contentItemId: formData.get("contentItemId"),
    title: formData.get("title"),
    bodyMarkdown: formData.get("bodyMarkdown") || undefined,
    externalUrl: formData.get("externalUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    const item = await CourseService.updateContentItem({ teacherUserId: user.id, ...parsed.data });
    revalidatePath(`/teacher/courses/${item.courseId}`);
  } catch (err) {
    if (err instanceof CourseError) return { error: err.message };
    throw err;
  }

  return { success: true };
}

export async function deleteContentItemAction(contentItemId: string): Promise<{ error?: string }> {
  const user = await requireRole(["teacher"]);
  try {
    const item = await CourseService.deleteContentItem({ teacherUserId: user.id, contentItemId });
    revalidatePath(`/teacher/courses/${item.courseId}`);
    return {};
  } catch (err) {
    if (err instanceof CourseError) return { error: err.message };
    throw err;
  }
}

const contentItemSchema = z.object({
  courseId: z.string().min(1),
  themeId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(CONTENT_ITEM_TYPES),
  bodyMarkdown: z.string().optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
  r2Key: z.string().optional(),
});

export async function addContentItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = contentItemSchema.safeParse({
    courseId: formData.get("courseId"),
    themeId: formData.get("themeId"),
    title: formData.get("title"),
    type: formData.get("type"),
    bodyMarkdown: formData.get("bodyMarkdown") || undefined,
    externalUrl: formData.get("externalUrl") || undefined,
    r2Key: formData.get("r2Key") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await CourseService.addContentItem({ teacherUserId: user.id, ...parsed.data });
  } catch (err) {
    if (err instanceof CourseError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/teacher/courses/${parsed.data.courseId}`);
  return { success: true };
}

export async function requestContentFileUploadUrlAction(courseId: string, contentType: string) {
  const user = await requireRole(["teacher"]);
  try {
    await CourseService.assertTeacherOwnsCourse(user.id, courseId);
  } catch (err) {
    if (err instanceof CourseError) throw new Error(err.message);
    throw err;
  }
  if (contentType !== "application/pdf") throw new Error("Hanya file PDF yang didukung");

  const key = `course-content/${courseId}/${crypto.randomUUID()}`;
  const uploadUrl = await presignUpload(key, contentType);
  return { uploadUrl, key };
}
