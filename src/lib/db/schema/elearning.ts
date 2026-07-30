import { pgTable, text, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps, softDelete } from "./_shared";
import { subjects, classes, teachers, academicYears } from "./academics";
import { students } from "./people";

export const courses = pgTable("courses", {
  id: id(),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: text("subject_id")
    .notNull()
    .references(() => subjects.id),
  classId: text("class_id").references(() => classes.id), // nullable — could be grade-wide
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id), // owner/creator
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYears.id),
  isPublished: boolean("is_published").notNull().default(false),
  schoolId: schoolId(),
  ...timestamps,
});

// A named unit within a course ("Bab 1", "Bab 2", ...) grouping its own
// Materi/Tugas/Kuis. Every content item/assignment/quiz belongs to exactly
// one theme.
export const themes = pgTable("themes", {
  id: id(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
});

export const CONTENT_ITEM_TYPES = ["video", "pdf", "note", "link"] as const;
export type ContentItemType = (typeof CONTENT_ITEM_TYPES)[number];

export const courseContentItems = pgTable("course_content_items", {
  id: id(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  themeId: text("theme_id")
    .notNull()
    .references(() => themes.id),
  title: text("title").notNull(),
  type: text("type").notNull().$type<ContentItemType>(),
  r2Key: text("r2_key"), // for video/pdf
  bodyMarkdown: text("body_markdown"), // for 'note' type
  externalUrl: text("external_url"), // for 'link' type
  orderIndex: integer("order_index").notNull().default(0),
  durationSeconds: integer("duration_seconds"), // for video
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
});

export const assignments = pgTable("assignments", {
  id: id(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  themeId: text("theme_id")
    .notNull()
    .references(() => themes.id),
  title: text("title").notNull(),
  instructions: text("instructions"), // markdown
  dueDate: text("due_date").notNull(), // YYYY-MM-DD
  maxScore: integer("max_score").notNull(),
  allowLateSubmission: boolean("allow_late_submission").notNull().default(true),
  attachmentR2Key: text("attachment_r2_key"),
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
});

export const SUBMISSION_STATUSES = ["submitted", "late", "graded", "missing"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const assignmentSubmissions = pgTable(
  "assignment_submissions",
  {
    id: id(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    submittedAt: timestamp("submitted_at", { mode: "date" }),
    textResponse: text("text_response"),
    attachmentR2Key: text("attachment_r2_key"),
    status: text("status").notNull().$type<SubmissionStatus>().default("missing"),
    score: integer("score"),
    feedback: text("feedback"),
    gradedByTeacherId: text("graded_by_teacher_id").references(() => teachers.id),
    gradedAt: timestamp("graded_at", { mode: "date" }),
    schoolId: schoolId(),
    ...timestamps,
  },
  (t) => [unique().on(t.assignmentId, t.studentId)]
);
