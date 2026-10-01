import { pgTable, text, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps, softDelete } from "./_shared";
import { users } from "./users";

export const MARITAL_STATUSES = ["belum_kawin", "kawin", "cerai_hidup", "cerai_mati"] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

// Real example on the form is the literal string "GTY/PTY" (one combined
// answer) — kept loose since only one example value was recoverable from
// the sample file, see TSD-02 open questions.
export const EMPLOYMENT_STATUSES = ["gty_pty", "pns", "honorer"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const SALARY_SOURCES = ["yayasan", "apbn", "apbd", "komite", "lainnya"] as const;
export type SalarySource = (typeof SALARY_SOURCES)[number];

export const academicYears = pgTable("academic_years", {
  id: id(),
  name: text("name").notNull(), // e.g. "2026/2027"
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(),
  isCurrent: boolean("is_current").notNull().default(false),
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
});

export const subjects = pgTable("subjects", {
  id: id(),
  name: text("name").notNull(), // e.g. "Mathematics"
  code: text("code"),
  schoolId: schoolId(),
  ...timestamps,
  ...softDelete,
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
  fingerprintId: text("fingerprint_id").unique(), // fingerprint-machine person ID, mapped once via attendance import

  // Dapodik F-PTK — Identitas Pendidik (verified against a real completed
  // record, see TSD-02). The ~15 Riwayat/history tables on the real form
  // are out of scope — this is the single-row "profile" data only.
  dateOfBirth: text("date_of_birth"),
  placeOfBirth: text("place_of_birth"),
  motherName: text("mother_name"), // Nama Ibu Kandung
  addressDetail: text("address_detail"),
  dusun: text("dusun"),
  rt: text("rt"),
  rw: text("rw"),
  kelurahan: text("kelurahan"),
  postalCode: text("postal_code"),
  kecamatan: text("kecamatan"),
  kabupaten: text("kabupaten"),
  provinsi: text("provinsi"),
  nik: text("nik").unique(),
  npwp: text("npwp"),
  taxpayerName: text("taxpayer_name"), // Nama Wajib Pajak
  maritalStatus: text("marital_status").$type<MaritalStatus>(),
  spouseName: text("spouse_name"), // Nama Suami/Istri
  spouseOccupation: text("spouse_occupation"), // Pekerjaan Suami/Istri

  // Kepegawaian
  employmentStatus: text("employment_status").$type<EmploymentStatus>(), // Status Pegawai
  niyNigk: text("niy_nigk").unique(), // N I Y / N I G K — Yayasan staff ID
  nigb: text("nigb").unique(), // N I G B — "berstatus guru bantu" only
  nip: text("nip").unique(), // separate from employeeNumber — PNS only
  nuptk: text("nuptk").unique(),
  ptkType: text("ptk_type"), // Jenis PTK — e.g. "Guru"
  isActive: boolean("is_active").notNull().default(true), // Status Aktif
  appointmentDecreeNumber: text("appointment_decree_number"), // SK Pengangkatan
  appointmentEffectiveDate: text("appointment_effective_date"), // TMT Pengangkatan
  appointmentDecreeIssuer: text("appointment_decree_issuer"), // Lembaga Pengangkat
  cpnsDecreeNumber: text("cpns_decree_number"), // S K CPNS — PNS only
  cpnsEffectiveDate: text("cpns_effective_date"), // TMT CPNS
  pnsEffectiveDate: text("pns_effective_date"), // TMT PNS
  rankGrade: text("rank_grade"), // Pangkat/Golongan
  salarySource: text("salary_source").$type<SalarySource>(),

  // Penugasan (assignment at this specific school)
  assignmentLetterNumber: text("assignment_letter_number"), // No Surat Tugas
  assignmentLetterDate: text("assignment_letter_date"), // Tgl Surat Tugas
  assignmentEffectiveDate: text("assignment_effective_date"), // TMT Tugas
  isHomeSchool: boolean("is_home_school"), // Sekolah Induk (Ya/Tidak)

  // Kompetensi Khusus — conditional, only relevant for specific roles
  isPrincipalLicensed: boolean("is_principal_licensed"), // Lisensi Kepala Sekolah
  vocationalProgramCode: text("vocational_program_code"), // Kode Program Keahlian — SMK only
  specialNeedsTypesHandled: text("special_needs_types_handled"),
  specialNeedsSpecialization: text("special_needs_specialization"),
  specialNeedsSkills: text("special_needs_skills"),

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
  ...softDelete,
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
