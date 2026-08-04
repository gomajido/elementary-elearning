"use server";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService, GuardianPortalError } from "@/server/services/guardian-service";
import { GradeService } from "@/server/services/grade-service";
import { AttendanceService } from "@/server/services/attendance-service";
import { FeeService } from "@/server/services/fee-service";

/**
 * Backs the child-detail page's lazy per-tab fetch (see
 * child-detail-tabs.tsx): each tab calls one of these directly from the
 * client instead of the page fetching all three up front, same pattern as
 * reminder-table.tsx's client-invoked "use server" reads.
 */
async function assertOwnsChild(studentId: string) {
  const user = await requireRole(["parent"]);
  try {
    await GuardianService.assertGuardianOwnsStudent(user.id, studentId);
  } catch (err) {
    if (err instanceof GuardianPortalError) throw new Error("Tidak berwenang melihat siswa ini");
    throw err;
  }
}

export async function getChildGradesAction(studentId: string) {
  await assertOwnsChild(studentId);
  return GradeService.gradesForStudent(studentId);
}

export async function getChildAttendanceAction(studentId: string) {
  await assertOwnsChild(studentId);
  return AttendanceService.historyForStudent(studentId);
}

export async function getChildInvoicesAction(studentId: string) {
  await assertOwnsChild(studentId);
  return FeeService.invoicesForStudent(studentId);
}
