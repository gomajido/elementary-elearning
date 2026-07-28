import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

import { id, schoolId, timestamps } from "./_shared";
import { subjects, classes, teachers, academicYears } from "./academics";
import { students } from "./people";

export const courses = sqliteTable("courses", {
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
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  schoolId: schoolId(),
  ...timestamps,
});

export const CONTENT_ITEM_TYPES = ["video", "pdf", "note", "link"] as const;
export type ContentItemType = (typeof CONTENT_ITEM_TYPES)[number];

export const courseContentItems = sqliteTable("course_content_items", {
  id: id(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  title: text("title").notNull(),
  type: text("type").notNull().$type<ContentItemType>(),
  r2Key: text("r2_key"), // for video/pdf
  bodyMarkdown: text("body_markdown"), // for 'note' type
  externalUrl: text("external_url"), // for 'link' type
  orderIndex: integer("order_index").notNull().default(0),
  durationSeconds: integer("duration_seconds"), // for video
  schoolId: schoolId(),
  ...timestamps,
});

export const assignments = sqliteTable("assignments", {
  id: id(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  title: text("title").notNull(),
  instructions: text("instructions"), // markdown
  dueDate: text("due_date").notNull(), // YYYY-MM-DD
  maxScore: integer("max_score").notNull(),
  allowLateSubmission: integer("allow_late_submission", { mode: "boolean" })
    .notNull()
    .default(true),
  attachmentR2Key: text("attachment_r2_key"),
  schoolId: schoolId(),
  ...timestamps,
});

export const SUBMISSION_STATUSES = ["submitted", "late", "graded", "missing"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const assignmentSubmissions = sqliteTable(
  "assignment_submissions",
  {
    id: id(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    submittedAt: integer("submitted_at", { mode: "timestamp" }),
    textResponse: text("text_response"),
    attachmentR2Key: text("attachment_r2_key"),
    status: text("status").notNull().$type<SubmissionStatus>().default("missing"),
    score: integer("score"),
    feedback: text("feedback"),
    gradedByTeacherId: text("graded_by_teacher_id").references(() => teachers.id),
    gradedAt: integer("graded_at", { mode: "timestamp" }),
    schoolId: schoolId(),
    ...timestamps,
  },
  (t) => [unique().on(t.assignmentId, t.studentId)]
);
