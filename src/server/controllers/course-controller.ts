"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService, CourseError } from "@/server/services/course-service";
import { CONTENT_ITEM_TYPES } from "@/lib/db/schema";

export type ActionState = { error?: string };

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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

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

const contentItemSchema = z.object({
  courseId: z.string().min(1),
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
    title: formData.get("title"),
    type: formData.get("type"),
    bodyMarkdown: formData.get("bodyMarkdown") || undefined,
    externalUrl: formData.get("externalUrl") || undefined,
    r2Key: formData.get("r2Key") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await CourseService.addContentItem({ teacherUserId: user.id, ...parsed.data });
  } catch (err) {
    if (err instanceof CourseError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/teacher/courses/${parsed.data.courseId}`);
  return {};
}
