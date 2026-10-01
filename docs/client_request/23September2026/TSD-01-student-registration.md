# TSD-01 — Parent Self-Service Registration (Dapodik F-PD) + Teacher/Admin Approval + Export

Source: `docs/client_request/23September2026/request-list.md` item 1, sample form `docs/client_request/23September2026/1.Formulir Peserta Didik AHMAD HAMMAM NAUFAL ZAIM - SD MADANI ISLAMIC SCHOOL 2026-06-08 08_18_32.xls`.

## Problem

Client request (verbatim): *"ketika melakukan pendaftaran orang tua siswa mengisi data sesuai dengan form tercantum. Guru memiliki kemampuan approve dan tidak. serta bisa export/download data sesuai data siswa."*

Restated: a parent fills a registration form matching the attached government "Dapodik" F-PD (Formulir Peserta Didik) layout. A teacher (or admin) can approve or reject the submission. Staff can export/download registered student data in the same field shape.

## Current state

- **No self-service registration exists.** Only `(public)/setup` (one-time admin bootstrap) and `(public)/login` are public routes — confirmed via `src/app/(public)/`. README (`README.md:41`) states every account is admin-provisioned.
- Student creation today: `createStudentAction` (`src/server/controllers/student-controller.ts:13-66`, `requireRole(["admin"])`) → `StudentService.registerStudent` (`src/server/services/student-service.ts:37-91`) — one `db.transaction` inserting `students` + `enrollments` + up to 2 `guardians` + `studentGuardians` links, keyed by a caller-supplied `admissionNumber`.
- `students` schema (`src/lib/db/schema/people.ts:26-46`): `admissionNumber, firstName, lastName, dateOfBirth, gender, currentClassId, enrollmentStatus, enrollmentDate, medicalNotes, schoolId`. **No address field at all** on `students`. `guardians` (`people.ts:48-62`): `firstName, lastName, phone, email, relationshipType, address`.
- The Dapodik F-PD form requires a much larger, mostly-absent field set: NISN, NIS, Nomor Seri Ijazah/SKHUN, No. Ujian Nasional, NIK, sekolah asal (NPSN + nama), tempat lahir, agama, kebutuhan khusus, full address hierarchy (dusun/RT/RW/kelurahan/kecamatan/kabupaten/provinsi/kode pos + lintang/bujur), alat transportasi, jenis tinggal, no telp/HP, email pribadi, KKS/KPS/KIP program data, no. akta lahir, tinggi/berat badan, jarak/waktu tempuh ke sekolah, jumlah saudara kandung, plus repeating "prestasi" (achievements) and "pendidikan non-formal" tables, plus father/mother/wali demographic + income + education fields. None of this exists in any schema today.
- No `jsonb`/flexible columns exist anywhere in the schema (`src/lib/db/schema/*.ts` — verified) — house style is strictly-typed explicit columns via `src/lib/db/schema/_shared.ts` helpers (`id()`, `schoolId()`, `timestamps`, `softDelete`).
- Closest existing "unverified submission → staff must confirm" precedent: `payments.isVerified` (`src/lib/db/schema/fees.ts:86`) + `FeeService.submitPaymentClaim` (unverified, parent-submitted, `src/server/services/fee-service.ts:123-151`) vs. `FeeService.recordPayment` (verified, admin-submitted, `fee-service.ts:89-117`).
- No export/download feature exists anywhere in the app (grepped for export/download/CSV-generation, zero hits). `papaparse` (`^5.5.4`) is already a dependency, currently used only for **importing** CSV (`Papa.parse`) — see `src/server/services/teacher-import-service.ts:28`, `student-import-service.ts`. `Papa.unparse()` (same library, unused so far) is the natural export counterpart. `StudentRepository.listWithDetails()` (`src/server/repositories/student-repository.ts:73-85`) already joins `students` + `classes` name/section — the base query to extend.
- Enum-on-row convention used throughout: `$type<X>()` column + exported `const X_VALUES = [...] as const` + label map in `src/lib/labels.ts` (e.g. `ENROLLMENT_STATUSES` / `ENROLLMENT_STATUS_LABELS`).

## Decisions (settled with client/user — do not re-litigate)

- Registration form is **public, unauthenticated** (structural necessity: a parent has no login before a student record exists — guardian portal accounts are only ever granted *after* a guardian row exists, via `GuardianService.grantPortalAccess`). Protected with **Cloudflare Turnstile** before submit (repo has a `turnstile-spin` skill to wire this).
- **Any teacher or admin** may approve/reject a pending application — `requireRole(["teacher", "admin"])`, not restricted to a homeroom teacher.
- **All Dapodik fields on the form are mandatory** at submission (not optional/backfilled later), **with the exceptions the real form itself already marks as such** (see verified field list below): the "diisikan data dari jenjang sebelumnya" fields (only apply to a transfer student with a prior school record), the assistance-program fields (KKS/KPS/KIP — only apply to a family that has them), GPS coordinates, and the entire "DATA WALI" section, which is the one section header on the real form **not** marked "(WAJIB DIISI)". Repeating sub-tables (prestasi, pendidikan non-formal) stay 0+ rows — cardinality isn't a "some fields skippable" carve-out.
- `students`/`guardians` tables are **not** widened directly. A new staging/profile table holds the full Dapodik dataset instead (see Design) — keeps the 95%-of-queries-don't-need-this data out of the hot `students` table, and gives the approval workflow ('pending'/'approved'/'rejected') a natural home with no analogue on `students` today.

## Design

### Verified field list

The sample `.xls` turned out to be a **completed record** (a real filled-in form for "AHMAD HAMMAM NAUFAL ZAIM"), not a blank template — parsed the actual `<Row>`/`<Cell ss:Index>` structure (not just the shared-string text dump) to get every field's exact label, position, and a real example value in one pass. That surfaced several corrections to the original structural guess:

- **One `Nama Lengkap` field, not split first/last name.** The form has a single full-name field, unlike `students.firstName`/`lastName`. Collect it as one `fullName` field on the application; split it into first/last at approval time (naive split on first whitespace, with the reviewer able to fix it in the placement step, same as any other admin edit).
- **Two separate phone fields**: "No Telepon Rumah" (home) and "No. Hp" (mobile) — not one combined `phone`.
- **"Penghasilan Bulanan" (monthly income) is a categorical bracket string**, not a number — the real row shows `"Rp. 2,000,000 - Rp. 4,999,999"` and `"Tidak Berpenghasilan"`. Store as `text`, not `integer` cents. The standard Dapodik bracket list is well-known (`Tidak Berpenghasilan`, `Kurang dari Rp. 500.000`, `Rp. 500.000 - Rp. 999.999`, `Rp. 1.000.000 - Rp. 1.999.999`, `Rp. 2.000.000 - Rp. 4.999.999`, `Rp. 5.000.000 - Rp. 20.000.000`, `Lebih dari Rp. 20.000.000`) but this one example only confirms 2 of the 7 — flagged as an open question, not hard-coded as a DB enum (kept as free `text`, validated against a suggested list at the form layer only).
- **Father and mother each have their own "Berkebutuhan Khusus" (special needs) field** — missed entirely in the first pass.
- **"DATA WALI" (guardian) is the only section header without "(WAJIB DIISI)"** — confirms it's genuinely optional, not an assumption.
- **No "is deceased" field exists anywhere on the real form** — dropped `fatherIsDeceased`/`motherIsDeceased` from the original guess; not inventing fields the form doesn't have.
- **No NIK or relationship field for the wali** — the guardian section only has name/birth year/occupation/education/income. Dropped `guardianNik`/`guardianRelationship` for the same reason.
- **Achievements table has 5 columns**: Jenis Prestasi (type), Tingkat (level), Nama Prestasi (name), Tahun (year), Penyelenggaraan (organizer) — not 4, and there's no "rank" column.
- **Non-formal education table has 4 columns**: Jenis (type), Penyelenggara/Sumber (organizer/source), Tahun Mulai (start year), Tahun Selesai (end year) — not "duration in hours".
- **Dropped the invented "applicant contact" fields** (`applicantFullName`/`applicantPhone`/`applicantEmail`) — the real form has no such section; staff can reach the family via the household's own `mobilePhone`/`personalEmail`, which are already collected.
- **A top-of-form "Tingkat"/"Program" pair** (grade level / program track being applied for) exists, filled blank in this example — kept as optional fields capturing the parent's stated intent; distinct from the `classId`/`academicYearId` the reviewer actually assigns at approval.
- Both repeating tables had **zero rows** in this real completed record, confirming 0+ cardinality is a normal, valid state (not just an assumption).

### Schema — new file `src/lib/db/schema/registrations.ts` (add to barrel `src/lib/db/schema/index.ts`)

```ts
export const REGISTRATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const studentRegistrationApplications = pgTable("student_registration_applications", {
  id: id(),
  status: text("status").notNull().$type<RegistrationStatus>().default("pending"),
  submittedAt: timestamp("submitted_at", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  reviewedByUserId: text("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  rejectionReason: text("rejection_reason"),
  promotedStudentId: text("promoted_student_id").references(() => students.id),

  // parent's stated intent — informational, distinct from the reviewer's actual classId/academicYearId at approval
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

  // assistance-program fields — conditional, only apply to families that have these cards
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
  fatherMonthlyIncome: text("father_monthly_income").notNull(), // bracket string, see note above

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

// DATA PRESTASI — repeating, 0+ rows (verified: 0 rows is a normal state)
export const studentRegistrationAchievements = pgTable("student_registration_achievements", {
  id: id(),
  applicationId: text("application_id").notNull().references(() => studentRegistrationApplications.id),
  type: text("type").notNull(), // Jenis Prestasi
  level: text("level").notNull(), // Tingkat
  name: text("name").notNull(), // Nama Prestasi
  year: text("year").notNull(), // Tahun
  organizer: text("organizer").notNull(), // Penyelenggaraan
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});

// DATA PENDIDIKAN NON-FORMAL — repeating, 0+ rows
export const studentRegistrationNonformalEducations = pgTable("student_registration_nonformal_educations", {
  id: id(),
  applicationId: text("application_id").notNull().references(() => studentRegistrationApplications.id),
  type: text("type").notNull(), // Jenis
  organizerOrSource: text("organizer_or_source").notNull(), // Penyelenggara/Sumber
  startYear: text("start_year").notNull(), // Tahun Mulai
  endYear: text("end_year"), // Tahun Selesai — may be ongoing
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});
```

`students` gets one new nullable FK (bridges to the export requirement and lets admin-created students get a Dapodik profile attached retroactively):
```ts
registrationApplicationId: text("registration_application_id").references(() => studentRegistrationApplications.id),
```

`src/lib/labels.ts`: add `REGISTRATION_STATUS_LABELS = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" }`.

### Service / controller

- New `src/server/repositories/registration-repository.ts` — `RegistrationRepository`: `create(input)`, `findById(id)`, `listByStatus(status)`, `updateStatus(id, status, reviewerUserId, rejectionReason?)`, `linkPromotedStudent(id, studentId)`, `createAchievements(applicationId, rows[])`, `createNonformalEducations(applicationId, rows[])`.
- New `src/server/services/registration-service.ts` — `RegistrationService`:
  - `submitApplication(input): Promise<{ applicationId: string }>` — net-new, no `requireRole` (public).
  - `listPending(): Promise<Application[]>` — net-new.
  - `approveApplication(applicationId, reviewerUserId, placement: { classId, academicYearId, admissionNumber, enrollmentDate, firstName, lastName })` — net-new orchestration. `firstName`/`lastName` default to a naive split of `application.fullName` on the first whitespace, pre-filled in the approval form but editable by the reviewer (the form only has one `Nama Lengkap` field — splitting it is an approval-time judgment call, not something to guess silently). Inside one `db.transaction`: re-check `status === "pending"` (guards double-approval race, throws `RegistrationError` otherwise), call **`StudentService.registerStudent`** (extended — see below) to do the actual student/enrollment/guardian insert, then `RegistrationRepository.updateStatus(..., "approved")` + `linkPromotedStudent`.
  - `rejectApplication(applicationId, reviewerUserId, reason)` — net-new, simple status update.
  - `exportStudentsCsv(): Promise<string>` — net-new; extends `StudentRepository.listWithDetails()` with a left join to `studentRegistrationApplications` via `students.registrationApplicationId`, piped through `Papa.unparse()`.
- `StudentService.registerStudent` (`src/server/services/student-service.ts:37-91`) — **extended, not replaced**: add optional `registrationApplicationId?: string` to its input object, passed straight through to `StudentRepository.create`. `StudentRepository.create`'s `NewStudent` type (`student-repository.ts:6-15`) grows the same optional field.
- New `src/server/controllers/registration-controller.ts`:
  - `submitRegistrationApplicationAction(_prev, formData)` — **no `requireRole` call**; the one action in the codebase reachable while logged out. Validates the Turnstile token server-side before writing.
  - `listPendingApplicationsAction()` — `requireRole(["teacher", "admin"])`.
  - `approveApplicationAction(_prev, formData)` — `requireRole(["teacher", "admin"])`.
  - `rejectApplicationAction(_prev, formData)` — `requireRole(["teacher", "admin"])`.
  - `exportStudentsAction(): Promise<{ csv: string }>` — `requireRole(["teacher", "admin"])`; client reuses the existing `downloadCsv()` pattern from `src/components/forms/teacher-import-flow.tsx:20-28` to trigger the browser download client-side (no new Route Handler).

### New/changed files

- `src/lib/db/schema/registrations.ts` (new) + export line in `src/lib/db/schema/index.ts`
- `drizzle/migrations/00XX_*.sql` (generated via `bun run db:generate`)
- `src/lib/validation/registration.ts` (new — large zod schema, all fields `.min(1)`/required per the "all mandatory" decision)
- `src/lib/labels.ts` — add `REGISTRATION_STATUS_LABELS`
- `src/server/repositories/registration-repository.ts` (new)
- `src/server/services/registration-service.ts` (new)
- `src/server/services/student-service.ts` — extend `registerStudent` input
- `src/server/repositories/student-repository.ts` — extend `NewStudent` type
- `src/server/controllers/registration-controller.ts` (new)
- `src/components/forms/registration-form.tsx` (new — public, multi-section wizard given the field count, with Turnstile widget)
- `src/components/tables/registration-queue-table.tsx` (new — teacher/admin approve/reject queue)
- `src/app/(public)/register/page.tsx` (new)
- `src/app/(teacher)/teacher/registrations/page.tsx` and `src/app/(admin)/admin/registrations/page.tsx` (new — same queue component, different route wrapper per role's existing layout convention)
- Wire `exportStudentsAction` into `src/app/(admin)/admin/students/page.tsx`

## Edge cases

- **Public, unauthenticated, PII-collecting endpoint** (NIK, address, income, minors' data). Turnstile is the agreed mitigation; also rate-limit at the route/middleware level if abuse appears post-launch.
- Duplicate submissions (same NIK/NISN twice, or a retry after no response) — warn, don't hard-block; legitimate resubmissions happen.
- Rejected applicants have no login to see the rejection — no notification channel is wired for this flow (unlike fee reminders, which have WhatsApp/email). Flag as a follow-up if the client wants applicants notified.
- Concurrent approval of the same application by two staff members — guarded by the `status === "pending"` check inside the transaction.
- Approval needs internal fields the Dapodik form doesn't collect (`classId`, `academicYearId`, internal `admissionNumber`) — reviewer supplies these at approval time, same as today's manual `createStudentAction` flow.
- Admin-created students (not via self-service) have `registrationApplicationId = null` — export shows blank Dapodik columns for them. Allow admin to attach/back-fill a `studentRegistrationApplications` row to an existing student later, reusing this table as the general Dapodik-profile editor, not purely an intake artifact.
- `nis`/`certificateSerialNumber`/`skhunSerialNumber`/`nationalExamNumber`/`previousSchoolNpsn` are legitimately blank for a brand-new student with no prior school record (the real form's own "diisikan data dari jenjang sebelumnya" note) — kept nullable, unlike core identity fields.
- Splitting `fullName` into `firstName`/`lastName` at approval is a naive first-whitespace split — a single-word name, or a name where the intended split doesn't fall on the first space, needs the reviewer to correct it manually before submitting the placement form; don't try to be clever about it.

## Test plan

- vitest: zod validation tests for the registration schema — valid full submission, missing a required field, malformed NIK/phone format (mirrors `src/server/services/__tests__/teacher-import-service.test.ts` style).
- vitest: pure `buildDapodikExportRow(student, application)` mapping function — tested for both "has application" and "no application" (blank columns) cases.
- e2e (Playwright): anonymous browser context submits the application → login as teacher → approve with class/year placement → assert the student appears in `/admin/students` → export CSV and assert Dapodik columns are populated. Second scenario: reject with a reason, assert the application shows `rejected` and no student was created.

## Open questions for client

1. Should rejected applicants be notified out-of-band (phone/WhatsApp), or is "no notification" acceptable for v1?
2. Confirm the full 7-option "Penghasilan Bulanan" income-bracket list (only 2 of the assumed 7 standard Dapodik brackets appear in the one verified example) and the standard education-level list (only "SMA / sederajat" and "S1" are confirmed) before locking these down as dropdown option lists in the form — they're currently free `text` specifically so a wrong guess here doesn't require a migration to fix, just a form-layer constant.
3. Does the "Tingkat"/"Program" pair at the top of the form (`appliedGradeLevel`/`appliedProgram`) need to be collected at all, given the reviewer independently assigns the real `classId`/`academicYearId` at approval? Kept as optional in this design since the real form has them, but they may be redundant in practice.
