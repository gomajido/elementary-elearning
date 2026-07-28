import { pgTable, text, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps } from "./_shared";
import { users } from "./users";

export const academicYears = pgTable("academic_years", {
  id: id(),
  name: text("name").notNull(), // e.g. "2026/2027"
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(),
  isCurrent: boolean("is_current").notNull().default(false),
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});

export const subjects = pgTable("subjects", {
  id: id(),
  name: text("name").notNull(), // e.g. "Mathematics"
  code: text("code"),
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});

export const teachers = pgTable("teachers", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  hireDate: text("hire_date"), // YYYY-MM-DD
  employeeNumber: text("employee_number").notNull().unique(),
  bio: text("bio"),
  photoR2Key: text("photo_r2_key"),
  schoolId: schoolId(),
  ...timestamps,
  deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const classes = pgTable("classes", {
  id: id(),
  name: text("name").notNull(), // e.g. "Primary 3"
  section: text("section"), // e.g. "B", nullable for single-section schools
  gradeLevel: integer("grade_level").notNull(), // 0 = Kindergarten/Reception, 1-6 = Primary
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYears.id),
  classTeacherId: text("class_teacher_id").references(() => teachers.id),
  capacity: integer("capacity"),
  schoolId: schoolId(),
  ...timestamps,
});

export const teacherSubjectAssignments = pgTable(
  "teacher_subject_assignments",
  {
    id: id(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    schoolId: schoolId(),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    unique().on(t.classId, t.subjectId, t.academicYearId), // one teacher per subject per class per year
  ]
);
