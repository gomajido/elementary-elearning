"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { StudentService, StudentPortalError, type GuardianInput } from "@/server/services/student-service";
import { ENROLLMENT_STATUSES, GENDERS } from "@/lib/db/schema";
import { studentSchema } from "@/lib/validation/student";

export type CreateStudentState = { error?: string };

export async function createStudentAction(_prev: CreateStudentState, formData: FormData): Promise<CreateStudentState> {
  await requireRole(["admin"]);

  const raw = Object.fromEntries(formData.entries());
  const parsed = studentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const data = parsed.data;

  const guardians: GuardianInput[] = [
    {
      firstName: data.guardian1FirstName,
      lastName: data.guardian1LastName,
      relationshipType: data.guardian1Relationship,
      phone: data.guardian1Phone || undefined,
      email: data.guardian1Email || undefined,
      isPrimaryContact: true,
      isBillingContact: true,
    },
  ];

  if (data.guardian2FirstName && data.guardian2LastName && data.guardian2Relationship) {
    guardians.push({
      firstName: data.guardian2FirstName,
      lastName: data.guardian2LastName,
      relationshipType: data.guardian2Relationship,
      phone: data.guardian2Phone || undefined,
      email: data.guardian2Email || undefined,
      isPrimaryContact: false,
      isBillingContact: false,
    });
  }

  try {
    await StudentService.registerStudent({
      admissionNumber: data.admissionNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      classId: data.classId,
      academicYearId: data.academicYearId,
      enrollmentDate: data.enrollmentDate,
      guardians,
    });
  } catch (err) {
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return { error: "Nomor induk sudah digunakan" };
    }
    throw err;
  }

  revalidatePath("/admin/students");
  return {};
}

export type UpdateStudentState = { error?: string; success?: boolean };

const updateStudentSchema = z.object({
  studentId: z.string().min(1),
  admissionNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(GENDERS),
  classId: z.string().min(1),
  enrollmentDate: z.string().min(1),
  enrollmentStatus: z.enum(ENROLLMENT_STATUSES),
});

export async function updateStudentAction(_prev: UpdateStudentState, formData: FormData): Promise<UpdateStudentState> {
  await requireRole(["admin"]);

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateStudentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const data = parsed.data;

  try {
    await StudentService.updateStudent(data.studentId, {
      admissionNumber: data.admissionNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      currentClassId: data.classId,
      enrollmentDate: data.enrollmentDate,
      enrollmentStatus: data.enrollmentStatus,
    });
  } catch (err) {
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return { error: "Nomor induk sudah digunakan" };
    }
    throw err;
  }

  revalidatePath("/admin/students");
  return { success: true };
}

export async function deleteStudentAction(studentId: string) {
  await requireRole(["admin"]);
  await StudentService.deleteStudent(studentId);
  revalidatePath("/admin/students");
}

export type GrantStudentAccessState = { error?: string; tempPassword?: string; username?: string };

const grantAccessSchema = z.object({
  studentId: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
});

export async function grantStudentPortalAccessAction(
  _prev: GrantStudentAccessState,
  formData: FormData
): Promise<GrantStudentAccessState> {
  await requireRole(["admin"]);
  const parsed = grantAccessSchema.safeParse({
    studentId: formData.get("studentId"),
    email: formData.get("email") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    const { tempPassword, username } = await StudentService.grantPortalAccess(
      parsed.data.studentId,
      parsed.data.email || undefined
    );
    // No revalidatePath — see guardian-controller.ts for why: it would
    // swap this row's form for an "Active" badge before the one-time
    // temp password is shown.
    return { tempPassword, username };
  } catch (err) {
    if (err instanceof StudentPortalError) return { error: err.message };
    throw err;
  }
}
