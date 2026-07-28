"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService, AttendanceError } from "@/server/services/attendance-service";
import { ATTENDANCE_STATUSES } from "@/lib/db/schema";

export type SaveRegisterState = { error?: string; success?: boolean };

const entrySchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(ATTENDANCE_STATUSES),
  notes: z.string().optional(),
});

const saveRegisterSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  entries: z.array(entrySchema),
});

export async function saveRegisterAction(_prev: SaveRegisterState, formData: FormData): Promise<SaveRegisterState> {
  const user = await requireRole(["teacher"]);

  const classId = String(formData.get("classId"));
  const date = String(formData.get("date"));
  const studentIds = formData.getAll("studentId").map(String);
  const entries = studentIds.map((studentId) => ({
    studentId,
    status: String(formData.get(`status_${studentId}`)),
    notes: (formData.get(`notes_${studentId}`) as string) || undefined,
  }));

  const parsed = saveRegisterSchema.safeParse({ classId, date, entries });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await AttendanceService.saveRegister(user.id, parsed.data.classId, parsed.data.date, parsed.data.entries);
  } catch (err) {
    if (err instanceof AttendanceError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/teacher/attendance/${classId}`);
  return { success: true };
}
