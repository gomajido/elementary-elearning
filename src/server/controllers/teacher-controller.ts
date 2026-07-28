"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { TeacherService, TeacherRegistrationError } from "@/server/services/teacher-service";

export type CreateTeacherState = { error?: string; tempPassword?: string; email?: string };

const teacherSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeNumber: z.string().min(1),
  phone: z.string().optional(),
  hireDate: z.string().optional(),
});

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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const { tempPassword } = await TeacherService.registerTeacher(parsed.data);
    revalidatePath("/admin/teachers");
    return { tempPassword, email: parsed.data.email };
  } catch (err) {
    if (err instanceof TeacherRegistrationError) return { error: err.message };
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return { error: "Employee number already in use" };
    }
    throw err;
  }
}
