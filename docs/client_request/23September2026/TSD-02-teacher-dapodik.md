# TSD-02 — Teacher Data Matching Dapodik (F-PTK)

Source: `docs/client_request/23September2026/request-list.md` item 2, sample form `docs/client_request/23September2026/2. dapodik guru.xlsx`.

## Problem

Client request (verbatim): *"Ketika input data guru disesuaikan dengan dapodik juga sesuai dengan file tercantum."*

Restated: teacher data entry should collect the same fields as the government "Dapodik" F-PTK (Formulir Pendidik dan Tenaga Kependidikan) form.

## Current state

- `teachers` schema (`src/lib/db/schema/academics.ts:26-41`): `userId, firstName, lastName, phone, hireDate, employeeNumber (unique, doubles as login username), bio, schoolId`. Validation `teacherSchema` (`src/lib/validation/teacher.ts:3-10`) covers only `email, firstName, lastName, employeeNumber, phone?, hireDate?`.
- **Verified against the real F-PTK file** (parsed the actual `<row>`/`<c r="A1">` OOXML grid, not just the shared-strings text — same treatment as TSD-01/TSD-04). Unlike TSD-01's sample, the live worksheet cells mostly show blank/unfilled answers, but the file's shared-string table retains a complete filled example (teacher "ASTRID FEBRIANA KARIM, S.Pd") — real field labels **and** real example values, both confirmed. The form is far larger than the original structural guess: beyond identity/address/employment, it has **~15 more repeating "Riwayat" (history) tables** — Riwayat Gaji Berkala (salary history), Riwayat Jabatan Struktural/Fungsional, Riwayat Kepangkatan (rank history), Riwayat Pendidikan Formal (education history), Riwayat Sertifikasi, Riwayat Karir Guru (teaching career history) — plus Anak (children), Beasiswa (scholarships), Buku (published books), Diklat (training), Karya Tulis (publications), Kesejahteraan (welfare), Tunjangan (allowances), Tugas Tambahan (additional duties), Penghargaan (awards), Nilai Tes (test scores). **Decided with the user: out of scope for this pass** — that's a full HR-records system, not a same-day extension; flagged as a future request if the client wants full Dapodik reporting compliance. This TSD covers only the single-row "profile" sections: Identitas Pendidik, Kepegawaian, Penugasan, Kompetensi Khusus, Kontak.
- Within that in-scope set, fields absent from schema today: NIK, tempat/tanggal lahir, nama ibu kandung, full address hierarchy (dusun/RT/RW/kelurahan/kecamatan/kabupaten/provinsi/kode pos), NPWP, status kawin, nama & pekerjaan pasangan, NIP, NIY/NIGK, NIGB, NUPTK, jenis PTK, status aktif, status pegawai (GTY/PTY/PNS/Honorer), SK pengangkatan (nomor/tanggal/lembaga), TMT pengangkatan, SK/TMT CPNS/PNS (PNS-only), pangkat/golongan, sumber gaji, data penugasan (no. surat tugas/tanggal/TMT/sekolah induk), and the three Kompetensi Khusus fields (lisensi kepsek, kode program keahlian, penanganan siswa berkebutuhan khusus). **"No. Telepon" and "E-Mail" in the Kontak section map to already-existing columns** (`teachers.phone`, `users.email`) — no new columns needed for those two. Two PNS-only card fields on the real form (Kartu Pegawai, Karis/Karsu) are dropped from scope too — near-universally inapplicable at a Yayasan (foundation) school where staff are GTY/PTY, not PNS.
- Manual creation flow: `createTeacherAction`/`updateTeacherAction`/`deleteTeacherAction` (`src/server/controllers/teacher-controller.ts`, all `requireRole(["admin"])`) → `TeacherService.registerTeacher`/`updateTeacher` (`src/server/services/teacher-service.ts:30-77`, `17-23`) — creates `users` (role `teacher`, username = `employeeNumber`) + `teachers` atomically. `updateTeacher` has a load-bearing side effect: if `employeeNumber` changes, it calls `UserRepository.updateUsername` to keep login in sync (`teacher-service.ts:17-23`). Forms: `src/components/forms/teacher-form.tsx`, `edit-teacher-form.tsx`.
- No `jsonb`/flexible columns anywhere in the schema — strictly-typed explicit columns is the house style.
- Existing polymorphic `media` table (`src/lib/db/schema/media.ts:9-24`): `entityType` (currently `["student","teacher","guardian","class"]`), `entityId`, `storageKey`, `contentType`, `unique(entityType, entityId)` — reusable for a document upload (e.g. SK pengangkatan) without new schema.

## Decision (settled with user)

`teachers.employeeNumber` **stays the internal login code**, unrelated to government PNS status. Add a **new, separate, nullable `nip`** column — null for GTY/PTY/Honorer teachers (most of this school's staff), populated only for actual PNS teachers. Do **not** conflate the two; making `employeeNumber` literally the NIP would break login provisioning for every non-PNS teacher.

No approval workflow exists for teacher data edits (unlike TSD-01's registration flow) — admin already provisions teachers in one authoritative step. **Extend `teachers` directly**, not a companion table: there's no "pending vs. confirmed" state to model here, so a companion table would only add a join for zero workflow benefit.

## Design

### Schema — extend `teachers` in `src/lib/db/schema/academics.ts` (all new columns nullable, filled in progressively)

```ts
export const MARITAL_STATUSES = ["belum_kawin", "kawin", "cerai_hidup", "cerai_mati"] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

// Real example value on the form is the literal string "GTY/PTY" (one
// combined answer, not two) — kept as free text rather than a forced enum
// since only one example is confirmed; see open questions.
export const EMPLOYMENT_STATUSES = ["gty_pty", "pns", "honorer"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const SALARY_SOURCES = ["yayasan", "apbn", "apbd", "komite", "lainnya"] as const;
export type SalarySource = (typeof SALARY_SOURCES)[number];

// added to `teachers` — Identitas Pendidik
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
taxpayerName: text("taxpayer_name"), // Nama Wajib Pajak — only if different from the teacher's own name
maritalStatus: text("marital_status").$type<MaritalStatus>(),
spouseName: text("spouse_name"), // Nama Suami/Istri
spouseOccupation: text("spouse_occupation"), // Pekerjaan Suami/Istri

// Kepegawaian
employmentStatus: text("employment_status").$type<EmploymentStatus>(), // Status Pegawai
niyNigk: text("niy_nigk").unique(), // N I Y / N I G K — Yayasan staff ID
nigb: text("nigb").unique(), // N I G B — "berstatus guru bantu" only
nip: text("nip").unique(), // separate from employeeNumber — see decision above; PNS only
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
isHomeSchool: boolean("is_home_school"), // Sekolah Induk — Ya/Tidak

// Kompetensi Khusus — all conditional, only relevant for specific roles
isPrincipalLicensed: boolean("is_principal_licensed"), // Lisensi Kepala Sekolah (Ada/Tidak Ada)
vocationalProgramCode: text("vocational_program_code"), // Kode Program Keahlian — SMK only
specialNeedsTypesHandled: text("special_needs_types_handled"), // jenis ketunaan yang ditangani
specialNeedsSpecialization: text("special_needs_specialization"),
specialNeedsSkills: text("special_needs_skills"),
```

`src/lib/labels.ts`: add `MARITAL_STATUS_LABELS`, `EMPLOYMENT_STATUS_LABELS`, `SALARY_SOURCE_LABELS`.

> **Pre-implementation note, resolved**: exact field labels and real example values now verified directly against the file's shared-string table (teacher "ASTRID FEBRIANA KARIM, S.Pd" — NIK, tempat/tgl lahir KENDARI, ibu kandung AGUSTINA, alamat JL IMAM BONJOL / WAWOMBALATA / Kec. Mandonga / Kota Kendari / Prov. Sulawesi Tenggara, Islam, status kawin "Belum Kawin", status pegawai "GTY/PTY", SK Pengangkatan "21/SK/YHPIM/2026", sumber gaji "Yayasan"). The one still-open item is the exact **enum option list** for `employmentStatus`/`maritalStatus`/`salarySource` — only one example value is confirmed per field, see open questions.

### Service / controller

Keep `TeacherService.updateTeacher` and `updateTeacherAction` **untouched** — they own the username-sync side effect (`UserRepository.updateUsername`) and shouldn't risk being triggered by unrelated Dapodik-field edits.

- `TeacherRepository.update` (`src/server/repositories/teacher-repository.ts:51-54`) — **reused as-is**, already `Partial<TeacherUpdate>`; just widen the `TeacherUpdate` type (`teacher-repository.ts:71`) to include the new fields.
- `TeacherService.updateDapodikProfile(id: string, input: TeacherDapodikProfileInput): Promise<Teacher>` — **net-new**, thin wrapper over `TeacherRepository.update(id, input)`, kept separate for auditability and to avoid coupling to NIP/username-sync logic.
- `src/server/controllers/teacher-controller.ts` — add `updateTeacherDapodikProfileAction(_prev, formData)`, `requireRole(["admin"])`, validated by new `teacherDapodikProfileSchema` in `src/lib/validation/teacher.ts` (all fields optional, since Dapodik data is filled in over time — unlike TSD-01's mandatory-at-submit registration).
- Optional SK pengangkatan document upload: add `"teacher_sk_document"` to `MEDIA_ENTITY_TYPES` (`src/lib/db/schema/media.ts:9`) — distinct from the existing `"teacher"` type (profile photo), so both can coexist per teacher under the table's `unique(entityType, entityId)` constraint.

### New/changed files

- `src/lib/db/schema/academics.ts` — extend `teachers`, add 3 new const arrays + types
- `src/lib/db/schema/media.ts` — add one string to `MEDIA_ENTITY_TYPES` (optional, only if document upload is wanted)
- `drizzle/migrations/00XX_*.sql`
- `src/lib/validation/teacher.ts` — add `teacherDapodikProfileSchema`
- `src/lib/labels.ts` — 3 new label maps
- `src/server/repositories/teacher-repository.ts` — widen `TeacherUpdate`
- `src/server/services/teacher-service.ts` — add `updateDapodikProfile`
- `src/server/controllers/teacher-controller.ts` — add `updateTeacherDapodikProfileAction`
- `src/components/forms/teacher-dapodik-form.tsx` (new — a second tab/section on the teacher detail page, separate from `edit-teacher-form.tsx`)

## Edge cases

- NIK/NIP/NIY-NIGK/NIGB/NUPTK are `unique` but nullable — Postgres allows multiple `NULL`s under a unique constraint, so partially-filled records don't collide with each other; still need a friendly duplicate-value error message when a real value collides (mirror the existing `/UNIQUE/i.test(err.message)` pattern already used in `teacher-controller.ts:30,58`).
- `nip`/`cpnsDecreeNumber`/`cpnsEffectiveDate`/`pnsEffectiveDate` are legitimately blank for every GTY/PTY/Honorer teacher — this school's real example (Astrid) leaves all of them blank despite being a fully profiled, active teacher, confirming these are correctly optional, not "not filled in yet."
- Bulk CSV import (`src/server/services/teacher-import-service.ts`, `teacher-import-flow.tsx`) currently only imports the original 6 fields. Recommend **not** widening the import template — Dapodik data stays a manual post-import fill-in step, since ~30 extra CSV columns would be a usability regression for a bulk-onboarding tool. Flag if the client disagrees.
- The ~15 Riwayat/history repeating tables and the Anak/Beasiswa/Buku/Diklat/Karya Tulis/Kesejahteraan/Tunjangan/Tugas Tambahan/Penghargaan/Nilai Tes sub-tables are explicitly **out of scope** for this pass (user decision) — not modeled at all, not even as empty placeholder tables.

## Test plan

- vitest: zod validation tests for `teacherDapodikProfileSchema` (valid values, malformed NIK format, optional-field omission).
- e2e (Playwright): admin opens a teacher, fills the Dapodik tab, saves, reloads, asserts persistence. Also re-run the *existing* username-sync e2e path (editing name/`employeeNumber` via `updateTeacherAction`) to confirm it's unaffected — regression guard for keeping the two update paths separate.

## Open questions for client

1. Confirm the full option list for `maritalStatus`, `employmentStatus`, and `salarySource` dropdowns — only one real example value per field was recoverable from the sample file (Belum Kawin / GTY/PTY / Yayasan). Kept as free `text` for now specifically so a wrong guess doesn't need a migration to fix later.
2. Should the CSV bulk-import template for new teachers be widened to include any Dapodik fields, or is manual post-import fill-in acceptable (recommended)?
3. Confirmed out of scope for now (see Current state): all ~15 Riwayat/history tables and the Anak/Beasiswa/Buku/Diklat/Karya Tulis/Kesejahteraan/Tunjangan/Tugas Tambahan/Penghargaan/Nilai Tes sub-tables, plus the two PNS-only card fields (Kartu Pegawai, Karis/Karsu). Revisit if the client needs full Dapodik reporting compliance later.
