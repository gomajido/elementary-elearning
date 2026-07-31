"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import {
  TeacherImportService,
  type TeacherImportRow,
  type TeacherImportInvalidRow,
} from "@/server/services/teacher-import-service";
import { TeacherService, TeacherRegistrationError } from "@/server/services/teacher-service";

export type TeacherImportPreview = { valid: TeacherImportRow[]; invalid: TeacherImportInvalidRow[] };

export async function previewTeacherImportAction(csvText: string): Promise<TeacherImportPreview> {
  await requireRole(["admin"]);
  return TeacherImportService.parseRows(csvText);
}

export type TeacherImportResult = {
  succeeded: { name: string; employeeNumber: string; email: string; tempPassword: string }[];
  failed: { row: TeacherImportRow; error: string }[];
};

/** Each row is its own transaction (registerTeacher) — one row failing doesn't block the rest. */
export async function confirmTeacherImportAction(rows: TeacherImportRow[]): Promise<TeacherImportResult> {
  await requireRole(["admin"]);
  const succeeded: TeacherImportResult["succeeded"] = [];
  const failed: TeacherImportResult["failed"] = [];

  for (const row of rows) {
    try {
      const { tempPassword } = await TeacherService.registerTeacher(row);
      succeeded.push({ name: `${row.firstName} ${row.lastName}`, employeeNumber: row.employeeNumber, email: row.email, tempPassword });
    } catch (err) {
      const error = err instanceof TeacherRegistrationError || err instanceof Error ? err.message : "Gagal menyimpan baris ini";
      failed.push({ row, error });
    }
  }

  revalidatePath("/admin/teachers");
  return { succeeded, failed };
}
