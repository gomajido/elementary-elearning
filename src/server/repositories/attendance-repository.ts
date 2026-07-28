import { eq, and, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { attendanceRecords, students, type AttendanceStatus } from "@/lib/db/schema";

export type AttendanceUpsert = {
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  recordedByTeacherId: string;
  notes?: string;
};

export const AttendanceRepository = {
  /** Every active student in the class, left-joined with that date's record (if any). */
  async rosterForClassAndDate(classId: string, date: string) {
    const db = getDb();
    return db
      .select({ student: students, record: attendanceRecords })
      .from(students)
      .leftJoin(
        attendanceRecords,
        and(eq(attendanceRecords.studentId, students.id), eq(attendanceRecords.date, date))
      )
      .where(eq(students.currentClassId, classId))
      .orderBy(students.lastName, students.firstName);
  },

  async listForStudent(studentId: string) {
    const db = getDb();
    return db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId))
      .orderBy(attendanceRecords.date);
  },

  /**
   * Atomic upsert of a whole day's register — one class's submission is one
   * logical unit. Postgres supports a multi-row INSERT ... ON CONFLICT, so
   * the whole register saves in a single statement (each row's update
   * values come from its own proposed row via `excluded.*`).
   */
  async saveRegister(entries: AttendanceUpsert[]) {
    if (entries.length === 0) return;
    const db = getDb();
    await db
      .insert(attendanceRecords)
      .values(entries)
      .onConflictDoUpdate({
        target: [attendanceRecords.studentId, attendanceRecords.date],
        set: {
          status: sql`excluded.status`,
          notes: sql`excluded.notes`,
          recordedByTeacherId: sql`excluded.recorded_by_teacher_id`,
        },
      });
  },
};
