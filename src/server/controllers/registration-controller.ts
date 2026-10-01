"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  registrationApplicationSchema,
  registrationAchievementSchema,
  registrationNonformalEducationSchema,
} from "@/lib/validation/registration";
import { RegistrationService, RegistrationError } from "@/server/services/registration-service";
import { z } from "zod";

export type SubmitRegistrationState = { error?: string; applicationId?: string };

const submitInputSchema = z.object({
  application: registrationApplicationSchema,
  achievements: z.array(registrationAchievementSchema),
  nonformalEducations: z.array(registrationNonformalEducationSchema),
  turnstileToken: z.string().min(1, "Verifikasi keamanan wajib diselesaikan"),
});

/**
 * The one action in this app reachable while logged out — no `requireRole`
 * call. Takes a plain object, not FormData: the payload includes
 * variable-length achievement/non-formal-education arrays that don't map
 * cleanly onto a `<form action>` submission (same reasoning as
 * `promoteClassAction`/`confirmAttendanceImportAction` elsewhere in this app).
 */
export async function submitRegistrationApplicationAction(
  input: z.infer<typeof submitInputSchema>
): Promise<SubmitRegistrationState> {
  const parsed = submitInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  const remoteIp = (await headers()).get("x-forwarded-for") ?? undefined;
  const verified = await verifyTurnstileToken(parsed.data.turnstileToken, remoteIp);
  if (!verified) return { error: "Verifikasi keamanan gagal, silakan coba lagi" };

  const { applicationId } = await RegistrationService.submitApplication({
    application: parsed.data.application,
    achievements: parsed.data.achievements,
    nonformalEducations: parsed.data.nonformalEducations,
  });
  return { applicationId };
}

export async function listPendingApplicationsAction() {
  await requireRole(["teacher", "admin"]);
  return RegistrationService.listPending();
}

const placementSchema = z.object({
  applicationId: z.string().min(1),
  classId: z.string().min(1),
  academicYearId: z.string().min(1),
  admissionNumber: z.string().min(1),
  enrollmentDate: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string(),
});

export type ApproveApplicationState = { error?: string; success?: boolean };

export async function approveApplicationAction(
  _prev: ApproveApplicationState,
  formData: FormData
): Promise<ApproveApplicationState> {
  const user = await requireRole(["teacher", "admin"]);
  const raw = Object.fromEntries(formData.entries());
  const parsed = placementSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const { applicationId, ...placement } = parsed.data;

  try {
    await RegistrationService.approveApplication(applicationId, user.id, placement);
  } catch (err) {
    if (err instanceof RegistrationError) return { error: err.message };
    if (err instanceof Error && /unique/i.test(err.message)) return { error: "Nomor induk sudah digunakan" };
    throw err;
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/teacher/registrations");
  revalidatePath("/admin/students");
  return { success: true };
}

const rejectSchema = z.object({
  applicationId: z.string().min(1),
  reason: z.string().min(1, "Alasan penolakan wajib diisi"),
});

export type RejectApplicationState = { error?: string; success?: boolean };

export async function rejectApplicationAction(
  _prev: RejectApplicationState,
  formData: FormData
): Promise<RejectApplicationState> {
  const user = await requireRole(["teacher", "admin"]);
  const parsed = rejectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await RegistrationService.rejectApplication(parsed.data.applicationId, user.id, parsed.data.reason);
  } catch (err) {
    if (err instanceof RegistrationError) return { error: err.message };
    throw err;
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/teacher/registrations");
  return { success: true };
}

export async function exportStudentsAction() {
  await requireRole(["teacher", "admin"]);
  const csv = await RegistrationService.exportStudentsCsv();
  return { csv };
}
