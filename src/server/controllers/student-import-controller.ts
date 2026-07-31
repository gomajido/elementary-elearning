"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import {
  StudentImportService,
  type StudentImportRow,
  type StudentImportInvalidRow,
} from "@/server/services/student-import-service";
import { StudentService } from "@/server/services/student-service";

export type StudentImportPreview = { valid: StudentImportRow[]; invalid: StudentImportInvalidRow[] };

export async function previewStudentImportAction(csvText: string, academicYearId: string): Promise<StudentImportPreview> {
  await requireRole(["admin"]);
  return StudentImportService.parseRows(csvText, academicYearId);
}

export type StudentImportResult = {
  succeeded: { name: string; admissionNumber: string; username?: string; tempPassword?: string }[];
  failed: { row: StudentImportRow; error: string }[];
};

/** Each row is its own transaction (registerStudent, then grantPortalAccess) — one row failing doesn't block the rest. */
export async function confirmStudentImportAction(rows: StudentImportRow[]): Promise<StudentImportResult> {
  await requireRole(["admin"]);
  const succeeded: StudentImportResult["succeeded"] = [];
  const failed: StudentImportResult["failed"] = [];

  for (const row of rows) {
    try {
      const student = await StudentService.registerStudent({
        admissionNumber: row.admissionNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        dateOfBirth: row.dateOfBirth,
        gender: row.gender,
        classId: row.classId,
        academicYearId: row.academicYearId,
        enrollmentDate: row.enrollmentDate,
        guardians: row.guardians,
      });
      if (!student) throw new Error("Gagal membuat data siswa");
      const { username, tempPassword } = await StudentService.grantPortalAccess(student.id);
      succeeded.push({ name: `${row.firstName} ${row.lastName}`, admissionNumber: row.admissionNumber, username, tempPassword });
    } catch (err) {
      failed.push({ row, error: err instanceof Error ? err.message : "Gagal menyimpan baris ini" });
    }
  }

  revalidatePath("/admin/students");
  return { succeeded, failed };
}
