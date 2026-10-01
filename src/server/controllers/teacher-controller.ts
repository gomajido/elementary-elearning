"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { TeacherService, TeacherRegistrationError } from "@/server/services/teacher-service";
import { teacherSchema, teacherDapodikProfileSchema } from "@/lib/validation/teacher";

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

export type UpdateDapodikState = { error?: string; success?: boolean };

/** Empty-string form fields mean "not filled in" here, not a literal empty value — normalize before persisting. */
function blankToUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, v === "" ? undefined : v])) as T;
}

export async function updateTeacherDapodikProfileAction(
  _prev: UpdateDapodikState,
  formData: FormData
): Promise<UpdateDapodikState> {
  await requireRole(["admin"]);
  const teacherId = String(formData.get("teacherId"));
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  delete raw.teacherId;
  // Checkboxes are absent from FormData entirely when unchecked — read
  // presence directly rather than relying on string coercion (same pattern
  // as `isCurrent` in academic-controller.ts).
  raw.isActive = formData.has("isActive");
  raw.isHomeSchool = formData.has("isHomeSchool");
  raw.isPrincipalLicensed = formData.has("isPrincipalLicensed");
  const parsed = teacherDapodikProfileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await TeacherService.updateDapodikProfile(teacherId, blankToUndefined(parsed.data));
  } catch (err) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      return { error: "NIK/NIP/NUPTK ini sudah digunakan oleh guru lain" };
    }
    throw err;
  }

  revalidatePath("/admin/teachers");
  return { success: true };
}
