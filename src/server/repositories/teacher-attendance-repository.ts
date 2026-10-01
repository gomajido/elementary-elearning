import { eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { teacherAttendanceRecords, type AttendanceStatus } from "@/lib/db/schema";

export type TeacherAttendanceUpsert = {
  teacherId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  importedByUserId?: string;
  notes?: string;
};

export const TeacherAttendanceRepository = {
  /** Same atomic multi-row upsert shape as AttendanceRepository.saveRegister. */
  async saveRegister(entries: TeacherAttendanceUpsert[]) {
    if (entries.length === 0) return;
    const db = getDb();
    await db
      .insert(teacherAttendanceRecords)
      .values(entries)
      .onConflictDoUpdate({
        target: [teacherAttendanceRecords.teacherId, teacherAttendanceRecords.date],
        set: {
          status: sql`excluded.status`,
          notes: sql`excluded.notes`,
          checkInTime: sql`excluded.check_in_time`,
          checkOutTime: sql`excluded.check_out_time`,
          importedByUserId: sql`excluded.imported_by_user_id`,
        },
      });
  },

  async listForTeacher(teacherId: string) {
    const db = getDb();
    return db
      .select()
      .from(teacherAttendanceRecords)
      .where(eq(teacherAttendanceRecords.teacherId, teacherId))
      .orderBy(teacherAttendanceRecords.date);
  },
};
