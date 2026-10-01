import { pgTable, text, integer, timestamp, type AnyPgColumn } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps } from "./_shared";
import { users } from "./users";
import { students, type Gender } from "./people";

export const REGISTRATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

// Full field list verified against a real completed Dapodik F-PD form (see
// docs/client_request/23September2026/TSD-01-student-registration.md) — not
// a structural guess. Deliberately not widening `students`/`guardians`
// directly: this table doubles as the durable "Dapodik profile" export
// source, kept out of the hot students table.
export const studentRegistrationApplications = pgTable("student_registration_applications", {
  id: id(),
  status: text("status").notNull().$type<RegistrationStatus>().default("pending"),
  submittedAt: timestamp("submitted_at", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  reviewedByUserId: text("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  rejectionReason: text("rejection_reason"),
  promotedStudentId: text("promoted_student_id").references((): AnyPgColumn => students.id),

  // Parent's stated intent — informational, distinct from the reviewer's
  // actual classId/academicYearId assignment at approval.
  appliedGradeLevel: text("applied_grade_level"),
  appliedProgram: text("applied_program"),

  // A. IDENTITAS PESERTA DIDIK (WAJIB DI ISI)
  fullName: text("full_name").notNull(),
  gender: text("gender").notNull().$type<Gender>(),
  nisn: text("nisn").notNull(),
  nis: text("nis"), // school-assigned later, always blank pre-admission
  certificateSerialNumber: text("certificate_serial_number"), // Nomor Seri Ijazah — "diisikan data dari jenjang sebelumnya"
  skhunSerialNumber: text("skhun_serial_number"), // Nomor Seri SKHUN — same
  nationalExamNumber: text("national_exam_number"), // No. Ujian Nasional — same
  nik: text("nik").notNull(),
  previousSchoolNpsn: text("previous_school_npsn"), // same "jenjang sebelumnya" carve-out
  previousSchoolName: text("previous_school_name"),
  placeOfBirth: text("place_of_birth").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  religion: text("religion").notNull(),
  specialNeeds: text("special_needs").notNull(), // "Tidak ada" is a valid value, not null

  addressDetail: text("address_detail").notNull(),
  dusun: text("dusun"),
  rt: text("rt").notNull(),
  rw: text("rw").notNull(),
  kelurahan: text("kelurahan").notNull(),
  postalCode: text("postal_code"),
  kecamatan: text("kecamatan").notNull(),
  kabupaten: text("kabupaten").notNull(),
  provinsi: text("provinsi").notNull(),
  transportMode: text("transport_mode").notNull(),
  livingArrangement: text("living_arrangement").notNull(),
  homePhone: text("home_phone"),
  mobilePhone: text("mobile_phone"),
  personalEmail: text("personal_email"),

  // Assistance-program fields — conditional, only apply to families that
  // actually hold these cards.
  kksRecipient: text("kks_recipient"), // "Ya"/"Tidak"
  kksNumber: text("kks_number"),
  kpsRecipient: text("kps_recipient"),
  kpsNumber: text("kps_number"),
  pipEligibleReason: text("pip_eligible_reason"), // "Alasan Layak"
  kipRecipient: text("kip_recipient"),
  kipNumber: text("kip_number"),
  kipHolderName: text("kip_holder_name"), // "Nama Tertera di KIP"
  kipRejectReason: text("kip_reject_reason"), // "Alasan Menolak KIP"

  birthCertNumber: text("birth_cert_number").notNull(), // No Registrasi Akta Lahir
  latitude: text("latitude"), // GPS — optional, form's own example is a placeholder "0"
  longitude: text("longitude"),

  // DATA AYAH KANDUNG (WAJIB DIISI)
  fatherName: text("father_name").notNull(),
  fatherBirthYear: integer("father_birth_year").notNull(),
  fatherSpecialNeeds: text("father_special_needs").notNull(),
  fatherOccupation: text("father_occupation").notNull(),
  fatherEducationLevel: text("father_education_level").notNull(),
  fatherMonthlyIncome: text("father_monthly_income").notNull(), // bracket string, e.g. "Rp. 2,000,000 - Rp. 4,999,999"

  // DATA IBU KANDUNG (WAJIB DIISI)
  motherName: text("mother_name").notNull(),
  motherBirthYear: integer("mother_birth_year").notNull(),
  motherSpecialNeeds: text("mother_special_needs").notNull(),
  motherOccupation: text("mother_occupation").notNull(),
  motherEducationLevel: text("mother_education_level").notNull(),
  motherMonthlyIncome: text("mother_monthly_income").notNull(),

  // DATA WALI — the only section NOT marked "(WAJIB DIISI)" on the real form
  guardianName: text("guardian_name"),
  guardianBirthYear: integer("guardian_birth_year"),
  guardianOccupation: text("guardian_occupation"),
  guardianEducationLevel: text("guardian_education_level"),
  guardianMonthlyIncome: text("guardian_monthly_income"),

  // DATA PERIODIK (WAJIB DIISI)
  heightCm: integer("height_cm").notNull(),
  weightKg: integer("weight_kg").notNull(),
  distanceToSchoolKm: integer("distance_to_school_km").notNull(),
  travelTimeMinutes: integer("travel_time_minutes").notNull(),
  siblingCount: integer("sibling_count").notNull(),

  schoolId: schoolId(),
  ...timestamps,
});

// DATA PRESTASI — repeating, 0+ rows (verified against the real form: 0 rows is a normal state).
export const studentRegistrationAchievements = pgTable("student_registration_achievements", {
  id: id(),
  applicationId: text("application_id")
    .notNull()
    .references(() => studentRegistrationApplications.id),
  type: text("type").notNull(), // Jenis Prestasi
  level: text("level").notNull(), // Tingkat
  name: text("name").notNull(), // Nama Prestasi
  year: text("year").notNull(), // Tahun
  organizer: text("organizer").notNull(), // Penyelenggaraan
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});

// DATA PENDIDIKAN NON-FORMAL — repeating, 0+ rows.
export const studentRegistrationNonformalEducations = pgTable("student_registration_nonformal_educations", {
  id: id(),
  applicationId: text("application_id")
    .notNull()
    .references(() => studentRegistrationApplications.id),
  type: text("type").notNull(), // Jenis
  organizerOrSource: text("organizer_or_source").notNull(), // Penyelenggara/Sumber
  startYear: text("start_year").notNull(), // Tahun Mulai
  endYear: text("end_year"), // Tahun Selesai — may be ongoing
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});
