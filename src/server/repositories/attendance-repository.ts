import { eq, and } from "drizzle-orm";

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

  /** Atomic upsert of a whole day's register — one class's submission is one logical unit. */
  async saveRegister(entries: AttendanceUpsert[]) {
    if (entries.length === 0) return;
    const db = getDb();
    const statements = entries.map((entry) =>
      db
        .insert(attendanceRecords)
        .values(entry)
        .onConflictDoUpdate({
          target: [attendanceRecords.studentId, attendanceRecords.date],
          set: { status: entry.status, notes: entry.notes, recordedByTeacherId: entry.recordedByTeacherId },
        })
    );
    await db.batch(statements as unknown as [typeof statements[number], ...typeof statements]);
  },
};
