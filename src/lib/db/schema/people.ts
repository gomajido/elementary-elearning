import { pgTable, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps } from "./_shared";
import { users } from "./users";
import { classes, academicYears } from "./academics";

export const ENROLLMENT_STATUSES = [
  "active",
  "inactive",
  "graduated",
  "withdrawn",
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const GUARDIAN_RELATIONSHIP_TYPES = [
  "mother",
  "father",
  "guardian",
  "other",
] as const;
export type GuardianRelationshipType = (typeof GUARDIAN_RELATIONSHIP_TYPES)[number];

export const students = pgTable("students", {
  id: id(),
  // Nullable: young students don't necessarily have their own login —
  // see RFC 0001 "Roles & accounts".
  userId: text("user_id").unique().references(() => users.id),
  admissionNumber: text("admission_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // YYYY-MM-DD
  gender: text("gender"),
  currentClassId: text("current_class_id").references(() => classes.id), // denormalized fast-lookup; enrollments is the historical record
  enrollmentStatus: text("enrollment_status")
    .notNull()
    .$type<EnrollmentStatus>()
    .default("active"),
  enrollmentDate: text("enrollment_date").notNull(), // YYYY-MM-DD
  photoR2Key: text("photo_r2_key"),
  medicalNotes: text("medical_notes"),
  schoolId: schoolId(),
  ...timestamps,
  deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const guardians = pgTable("guardians", {
  id: id(),
  userId: text("user_id").unique().references(() => users.id), // nullable — not every guardian gets portal access
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  relationshipType: text("relationship_type")
    .notNull()
    .$type<GuardianRelationshipType>(),
  address: text("address"),
  schoolId: schoolId(),
  ...timestamps,
});

// Many-to-many: siblings share guardians.
export const studentGuardians = pgTable(
  "student_guardians",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id),
    isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
    isBillingContact: boolean("is_billing_contact").notNull().default(false), // who fees/invoices are addressed to
    createdAt: timestamps.createdAt,
  },
  (t) => [unique().on(t.studentId, t.guardianId)]
);

export const ENROLLMENT_RECORD_STATUSES = [
  "active",
  "promoted",
  "repeated",
  "transferred",
  "withdrawn",
] as const;
export type EnrollmentRecordStatus = (typeof ENROLLMENT_RECORD_STATUSES)[number];

// Per-academic-year class membership history — the source of truth for
// promotion tracking. `students.currentClassId` is a denormalized pointer
// kept in sync for fast lookups, updated whenever a new "active" row lands.
export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    status: text("status").notNull().$type<EnrollmentRecordStatus>().default("active"),
    enrolledAt: text("enrolled_at").notNull(), // YYYY-MM-DD
    schoolId: schoolId(),
  },
  (t) => [unique().on(t.studentId, t.academicYearId)]
);
