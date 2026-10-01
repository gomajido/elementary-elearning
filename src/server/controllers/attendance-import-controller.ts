"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { presignUpload, getObject } from "@/lib/storage/client";
import {
  AttendanceImportService,
  AttendanceImportError,
  type ImportTarget,
  type ResolvedImportRow,
} from "@/server/services/attendance-import-service";

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function requestAttendanceImportUploadAction(contentType: string) {
  await requireRole(["admin"]);
  if (contentType !== XLSX_CONTENT_TYPE) throw new Error("File harus berupa .xlsx");

  const key = `attendance-imports/${crypto.randomUUID()}.xlsx`;
  const uploadUrl = await presignUpload(key, contentType);
  return { uploadUrl, key };
}

export type AttendanceImportPreview = Awaited<ReturnType<typeof AttendanceImportService.previewImport>>;
export type AttendanceImportResult = Awaited<ReturnType<typeof AttendanceImportService.confirmImport>>;

export async function previewAttendanceImportAction(target: ImportTarget, storageKey: string) {
  await requireRole(["admin"]);

  const object = await getObject(storageKey);
  const bytes = await object.Body?.transformToByteArray();
  if (!bytes) throw new AttendanceImportError("Gagal membaca file yang diunggah");

  return AttendanceImportService.previewImport(target, bytes);
}

export async function confirmAttendanceImportAction(target: ImportTarget, resolved: ResolvedImportRow[]) {
  const user = await requireRole(["admin"]);

  const result = await AttendanceImportService.confirmImport(target, resolved, user.id);
  revalidatePath("/admin/attendance");
  return result;
}
