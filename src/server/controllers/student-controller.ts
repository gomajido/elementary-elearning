"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { StudentService, StudentPortalError, type GuardianInput } from "@/server/services/student-service";

export type CreateStudentState = { error?: string };

const relationshipTypeSchema = z.enum(["mother", "father", "guardian", "other"]);

const studentSchema = z.object({
  admissionNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.string().optional(),
  classId: z.string().min(1),
  academicYearId: z.string().min(1),
  enrollmentDate: z.string().min(1),
  guardian1FirstName: z.string().min(1),
  guardian1LastName: z.string().min(1),
  guardian1Relationship: relationshipTypeSchema,
  guardian1Phone: z.string().optional(),
  guardian1Email: z.string().email().optional().or(z.literal("")),
  guardian2FirstName: z.string().optional(),
  guardian2LastName: z.string().optional(),
  guardian2Relationship: relationshipTypeSchema.optional(),
  guardian2Phone: z.string().optional(),
  guardian2Email: z.string().email().optional().or(z.literal("")),
});

export async function createStudentAction(_prev: CreateStudentState, formData: FormData): Promise<CreateStudentState> {
  await requireRole(["admin"]);

  const raw = Object.fromEntries(formData.entries());
  const parsed = studentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
      gender: data.gender || undefined,
      classId: data.classId,
      academicYearId: data.academicYearId,
      enrollmentDate: data.enrollmentDate,
      guardians,
    });
  } catch (err) {
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return { error: "Admission number already in use" };
    }
    throw err;
  }

  revalidatePath("/admin/students");
  return {};
}

export type GrantStudentAccessState = { error?: string; tempPassword?: string };

const grantAccessSchema = z.object({
  studentId: z.string().min(1),
  email: z.string().email(),
});

export async function grantStudentPortalAccessAction(
  _prev: GrantStudentAccessState,
  formData: FormData
): Promise<GrantStudentAccessState> {
  await requireRole(["admin"]);
  const parsed = grantAccessSchema.safeParse({
    studentId: formData.get("studentId"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const { tempPassword } = await StudentService.grantPortalAccess(parsed.data.studentId, parsed.data.email);
    // No revalidatePath — see guardian-controller.ts for why: it would
    // swap this row's form for an "Active" badge before the one-time
    // temp password is shown.
    return { tempPassword };
  } catch (err) {
    if (err instanceof StudentPortalError) return { error: err.message };
    throw err;
  }
}
