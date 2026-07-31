"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { TeacherService, TeacherRegistrationError } from "@/server/services/teacher-service";
import { teacherSchema } from "@/lib/validation/teacher";

export type CreateTeacherState = { error?: string; tempPassword?: string; email?: string };

export async function createTeacherAction(_prev: CreateTeacherState, formData: FormData): Promise<CreateTeacherState> {
  await requireRole(["admin"]);
  const parsed = teacherSchema.safeParse({
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    employeeNumber: formData.get("employeeNumber"),
    phone: formData.get("phone") || undefined,
    hireDate: formData.get("hireDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    const { tempPassword } = await TeacherService.registerTeacher(parsed.data);
    revalidatePath("/admin/teachers");
    return { tempPassword, email: parsed.data.email };
  } catch (err) {
    if (err instanceof TeacherRegistrationError) return { error: err.message };
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return { error: "Nomor pegawai sudah digunakan" };
    }
    throw err;
  }
}

export type UpdateTeacherState = { error?: string; success?: boolean };

const updateTeacherSchema = z.object({
  teacherId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeNumber: z.string().min(1),
  phone: z.string().optional(),
  hireDate: z.string().optional(),
});

export async function updateTeacherAction(_prev: UpdateTeacherState, formData: FormData): Promise<UpdateTeacherState> {
  await requireRole(["admin"]);
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateTeacherSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const { teacherId, ...input } = parsed.data;

  try {
    await TeacherService.updateTeacher(teacherId, { ...input, phone: input.phone || undefined, hireDate: input.hireDate || undefined });
  } catch (err) {
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return { error: "Nomor pegawai sudah digunakan" };
    }
    throw err;
  }

  revalidatePath("/admin/teachers");
  return { success: true };
}

export async function deleteTeacherAction(teacherId: string) {
  await requireRole(["admin"]);
  await TeacherService.deleteTeacher(teacherId);
  revalidatePath("/admin/teachers");
}
