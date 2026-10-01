import { pgTable, text, unique } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps } from "./_shared";
import { students } from "./people";
import { classes, teachers } from "./academics";
import { users } from "./users";

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id),
    date: text("date").notNull(), // YYYY-MM-DD — avoids timezone off-by-one bugs
    status: text("status").notNull().$type<AttendanceStatus>(),
    // Nullable: imported rows (see attendance-import-service.ts) have no
    // recording teacher — only manual register entries always supply one.
    recordedByTeacherId: text("recorded_by_teacher_id").references(() => teachers.id),
    checkInTime: text("check_in_time"), // "HH:MM", set by fingerprint import only
    checkOutTime: text("check_out_time"),
    importedByUserId: text("imported_by_user_id").references(() => users.id),
    notes: text("notes"),
    schoolId: schoolId(),
    createdAt: timestamps.createdAt,
  },
  (t) => [unique().on(t.studentId, t.date)]
);

// Mirrors attendanceRecords for staff — a separate table (not a
// discriminator column) matches the codebase's existing convention of fully
// separate students/teachers tables rather than one shared "people" table.
export const teacherAttendanceRecords = pgTable(
  "teacher_attendance_records",
  {
    id: id(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    date: text("date").notNull(),
    status: text("status").notNull().$type<AttendanceStatus>(),
    checkInTime: text("check_in_time"),
    checkOutTime: text("check_out_time"),
    importedByUserId: text("imported_by_user_id").references(() => users.id),
    notes: text("notes"),
    schoolId: schoolId(),
    createdAt: timestamps.createdAt,
  },
  (t) => [unique().on(t.teacherId, t.date)]
);
