import { pgTable, text, unique } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps } from "./_shared";
import { students } from "./people";
import { classes, teachers } from "./academics";

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
    recordedByTeacherId: text("recorded_by_teacher_id")
      .notNull()
      .references(() => teachers.id),
    notes: text("notes"),
    schoolId: schoolId(),
    createdAt: timestamps.createdAt,
  },
  (t) => [unique().on(t.studentId, t.date)]
);
