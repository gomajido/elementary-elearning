"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { AcademicService } from "@/server/services/academic-service";

export type ActionState = { error?: string };

const academicYearSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isCurrent: z.coerce.boolean().optional(),
});

export async function createAcademicYearAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = academicYearSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isCurrent: formData.get("isCurrent") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await AcademicService.createAcademicYear(parsed.data);
  revalidatePath("/admin/academic-years");
  return {};
}

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
});

export async function createSubjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await AcademicService.createSubject(parsed.data);
  revalidatePath("/admin/subjects");
  return {};
}

const classSchema = z.object({
  name: z.string().min(1),
  section: z.string().optional(),
  gradeLevel: z.coerce.number().int().min(0).max(12),
  academicYearId: z.string().min(1),
  classTeacherId: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
});

export async function createClassAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = classSchema.safeParse({
    name: formData.get("name"),
    section: formData.get("section") || undefined,
    gradeLevel: formData.get("gradeLevel"),
    academicYearId: formData.get("academicYearId"),
    classTeacherId: formData.get("classTeacherId") || undefined,
    capacity: formData.get("capacity") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await AcademicService.createClass(parsed.data);
  revalidatePath("/admin/classes");
  return {};
}

const assignmentSchema = z.object({
  teacherId: z.string().min(1),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  academicYearId: z.string().min(1),
});

export async function assignTeacherAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = assignmentSchema.safeParse({
    teacherId: formData.get("teacherId"),
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId"),
    academicYearId: formData.get("academicYearId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await AcademicService.assignTeacherToClassSubject(parsed.data);
  } catch {
    return { error: "This class already has a teacher assigned for that subject and year" };
  }
  revalidatePath("/admin/classes");
  return {};
}
