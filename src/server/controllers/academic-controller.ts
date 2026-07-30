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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  await AcademicService.createAcademicYear(parsed.data);
  revalidatePath("/admin/academic-years");
  return {};
}

const updateAcademicYearSchema = academicYearSchema.extend({ academicYearId: z.string().min(1) });

export async function updateAcademicYearAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = updateAcademicYearSchema.safeParse({
    academicYearId: formData.get("academicYearId"),
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isCurrent: formData.get("isCurrent") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const { academicYearId, ...input } = parsed.data;

  await AcademicService.updateAcademicYear(academicYearId, input);
  revalidatePath("/admin/academic-years");
  return {};
}

export async function deleteAcademicYearAction(academicYearId: string) {
  await requireRole(["admin"]);
  await AcademicService.deleteAcademicYear(academicYearId);
  revalidatePath("/admin/academic-years");
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  await AcademicService.createSubject(parsed.data);
  revalidatePath("/admin/subjects");
  return {};
}

const updateSubjectSchema = subjectSchema.extend({ subjectId: z.string().min(1) });

export async function updateSubjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = updateSubjectSchema.safeParse({
    subjectId: formData.get("subjectId"),
    name: formData.get("name"),
    code: formData.get("code") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const { subjectId, ...input } = parsed.data;

  await AcademicService.updateSubject(subjectId, input);
  revalidatePath("/admin/subjects");
  return {};
}

export async function deleteSubjectAction(subjectId: string) {
  await requireRole(["admin"]);
  await AcademicService.deleteSubject(subjectId);
  revalidatePath("/admin/subjects");
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  await AcademicService.createClass(parsed.data);
  revalidatePath("/admin/classes");
  return {};
}

const updateClassSchema = classSchema.extend({ classId: z.string().min(1) });

export async function updateClassAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const parsed = updateClassSchema.safeParse({
    classId: formData.get("classId"),
    name: formData.get("name"),
    section: formData.get("section") || undefined,
    gradeLevel: formData.get("gradeLevel"),
    academicYearId: formData.get("academicYearId"),
    classTeacherId: formData.get("classTeacherId") || undefined,
    capacity: formData.get("capacity") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const { classId, ...input } = parsed.data;

  await AcademicService.updateClass(classId, input);
  revalidatePath("/admin/classes");
  return {};
}

export async function deleteClassAction(classId: string) {
  await requireRole(["admin"]);
  await AcademicService.deleteClass(classId);
  revalidatePath("/admin/classes");
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await AcademicService.assignTeacherToClassSubject(parsed.data);
  } catch {
    return { error: "Kelas ini sudah memiliki guru untuk mata pelajaran dan tahun tersebut" };
  }
  revalidatePath("/admin/classes");
  return {};
}
