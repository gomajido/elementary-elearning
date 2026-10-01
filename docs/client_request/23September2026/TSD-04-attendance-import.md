# TSD-04 — Fingerprint Attendance Import (Student & Teacher)

Source: `docs/client_request/23September2026/request-list.md` items 4 & 5 (combined into one TSD — same mechanism, only the target table and a couple of columns differ), sample exports `docs/client_request/23September2026/4.ss.xlsx` (siswa/student) and `5.sg.xlsx` (guru/staff).

## Problem

Client requests (verbatim):
- *"kehadiran bisa di input via excel karena sekarang menggunakan aplikasi finger print untuk siswa"*
- *"kehadiran bisa di input via excel karena sekarang menggunakan aplikasi finger print untuk guru"*

Restated: the school now uses a fingerprint attendance machine for both students and staff. Its monthly `.xlsx` export should be importable directly into the app instead of manual per-day entry.

## Current state

- `attendance_records` (`src/lib/db/schema/attendance.ts:10-30`) is **student-only**: `studentId, classId, date, status (present/absent/late/excused), recordedByTeacherId (NOT NULL), notes`, unique on `(studentId, date)`. **No check-in/check-out time columns.** **No teacher/staff attendance table exists at all.**
- Manual flow today: `saveRegisterAction` (`src/server/controllers/attendance-controller.ts`, `requireRole(["teacher"])`) → `AttendanceService.saveRegister` (`src/server/services/attendance-service.ts:25-49`, verifies the caller is that class's homeroom teacher) → `AttendanceRepository.saveRegister` (`src/server/repositories/attendance-repository.ts:54-68`) — a single multi-row `INSERT ... ON CONFLICT DO UPDATE` keyed on `(studentId, date)`. **This upsert is directly reusable for import.**
- **No Excel-parsing library exists anywhere** — only `papaparse` (CSV) is a dependency, used for the two existing CSV imports (`teacher-import-service.ts`, `student-import-service.ts`). This feature needs a new dependency, e.g. `xlsx` (SheetJS) — the first binary-spreadsheet parser in the codebase.
- The two sample files are **not clean tables**: one sheet, repeated per-person blocks. **Verified by parsing the actual sheet XML (cell-by-cell, not just the text dump)** — `4.ss.xlsx` has 73 person-blocks, `5.sg.xlsx` has 16. Exact block layout, offsets from the `Nama:` row:
  - `Nama:` row (r): e.g. `Nama: Chalissa`
  - r+1: `ID: 10 | Departemen: Office | Posisi: Siswa SD` — `Posisi` in the staff file is one of `Guru SD`, `Guru TK`, `Kepala Sekolah SD`, `Kepala Sekolah TK`, `Ketua Yayasan` (all confirmed values, not guessed)
  - r+2: blank
  - r+3: `Rekap Absensi Pegawai`
  - r+4..r+6: summary stats (`Kehadiran`, `Durasi Kerja`, `Alpha`, `Presentase Kehadiran`, `Jumlah Izin`, `Datang Terlambat`, etc.) — **not needed by the importer**, the per-day rows below are the source of truth; don't parse these, just skip to the next `Tanggal` header
  - r+7: blank
  - r+8, r+9: two-row wrapped table header (`Tanggal | Hari | Ketentuan(Masuk) | (Pulang) | Absensi Masuk | Terlambat | Absensi Pulang | Pulang Cepat | ... | Masuk Kerja | Libur | Keterangan`) — parser should locate this by scanning for a cell equal to `"Tanggal"`, not by fixed offset (offset held at r+10 for data start in both sample files, but don't hard-code it)
  - r+10 onward: one row per day (12 columns, **not the ~10 originally estimated**) until a blank row, confirmed via **exact column semantics below**, cross-checked against the block's own summary stats (e.g. Chalissa's 3 late-rows summing to 19 minutes matches her header's `Datang Terlambat: 0:19 (3)` exactly):
    | Col | Field | Example | Notes |
    |---|---|---|---|
    | A | Tanggal | `03/08/2026` | DD/MM/YYYY |
    | B | Hari | `Senin` | day name, informational only |
    | C | Ketentuan Masuk (scheduled check-in) | `07.00` or `-` | `-` on non-workdays |
    | D | Ketentuan Pulang (scheduled check-out) | `12.55` or `-` | |
    | E | Absensi Masuk (actual check-in) | `06.59` or `-` | → `checkInTime` |
    | F | Terlambat (late duration) | `00.06` or `-` | non-`-` ⇒ status `late` |
    | G | Absensi Pulang (actual check-out) | usually `-` in both samples | → `checkOutTime`; **often absent** — both sample files are dominated by single-scan (check-in only) days, matching their own `Tidak Absen Keluar` (missed-checkout) counts |
    | H | Pulang Cepat (early-leave duration) | `-` | not persisted — no schema column for it |
    | I | Durasi Kerja per day (work duration) | `05.55` | not persisted — no schema column for it; this is NOT a checkout time despite the position, confirmed by summing to the block's `Durasi Kerja` total |
    | J | Masuk Kerja (attended flag) | `1` / `0` | |
    | K | Libur (scheduled-holiday flag) | `1` / `0` | |
    | L | Keterangan (note) | `""`, `"Libur Rutin"`, or `"Alpha"` | **exhaustive across both real files** — every one of 970 data rows checked falls into exactly one of these three; no `"Izin"`/`"Sakit"`/`"Cuti"` appears anywhere despite `Jumlah Izin` existing as a summary stat (some period must have had izin days not present in this particular export window) |
  - Then 1-2 blank rows, then the next block's `LAPORAN RINCIAN HARIAN` title row.
- **No external/fingerprint-device ID column exists** on `students` or `teachers`. The export's `ID` field is fingerprint-machine-internal, with no guaranteed relation to `admissionNumber`/`employeeNumber`. **No fuzzy-name-matching utility exists anywhere** in the codebase (grepped `levenshtein`/`fuzzy`/`similarity`, zero hits) — error-prone to build from scratch given likely duplicate/similar Indonesian names.
- **No background job/queue infrastructure exists anywhere**: `wrangler.jsonc` has no Queues/Durable Objects/Workflows/cron binding (only `ASSETS`, `WORKER_SELF_REFERENCE`, `HYPERDRIVE`, `NEXT_INC_CACHE_R2_BUCKET`, `IMAGES`). Upstash Redis (`src/lib/cache/redis.ts`) is used strictly as a cache-aside helper, not a queue. All existing bulk operations (`confirmTeacherImportAction`, `AttendanceRepository.saveRegister`) run fully synchronously inside one Server Action.
- Two-stage import UX already established (`teacher-import-flow.tsx`, `teacher-import-controller.ts`): client reads the file → `preview*Action` returns a typed preview → user reviews/confirms → `confirm*Action` commits, one row = one atomic write, one failure doesn't block the rest.

## Design decisions

- **Person matching**: exact-match on a new nullable `fingerprintId` column, **admin-confirmed once per unmatched person via the import preview screen** — not fuzzy name matching. Once an admin manually resolves an unmatched block to a student/teacher, persist `fingerprintId` back onto that record so every future month's import matches automatically with zero manual work.
- **Processing**: stay **fully synchronous, in-request** — no queue infrastructure exists anywhere in this codebase, and building one solely for a monthly admin task is a large net-new architectural investment. Process the whole workbook in one request; document a scaling ceiling instead of pre-building async infra (see Edge cases).
- **Schema shape for teacher attendance**: a **separate `teacher_attendance_records` table**, not a discriminator column on a shared table — matches the codebase's existing convention of `students`/`teachers` being fully separate tables rather than one `people` table with a role column.

## Design

### Schema

New dependency in `package.json`: `xlsx` (SheetJS).

```ts
// src/lib/db/schema/people.ts
fingerprintId: text("fingerprint_id").unique(), // added to students

// src/lib/db/schema/academics.ts
fingerprintId: text("fingerprint_id").unique(), // added to teachers
```

`src/lib/db/schema/attendance.ts` — extend `attendanceRecords`, add new table:
```ts
// attendanceRecords additions
checkInTime: text("check_in_time"),   // "HH:MM", nullable
checkOutTime: text("check_out_time"), // nullable
importedByUserId: text("imported_by_user_id").references(() => users.id), // nullable
// BREAKING CHANGE: recordedByTeacherId becomes nullable — imported rows have no recording teacher
recordedByTeacherId: text("recorded_by_teacher_id").references(() => teachers.id), // was .notNull()

export const teacherAttendanceRecords = pgTable(
  "teacher_attendance_records",
  {
    id: id(),
    teacherId: text("teacher_id").notNull().references(() => teachers.id),
    date: text("date").notNull(),
    status: text("status").notNull().$type<AttendanceStatus>(), // reuses existing enum
    checkInTime: text("check_in_time"),
    checkOutTime: text("check_out_time"),
    notes: text("notes"),
    importedByUserId: text("imported_by_user_id").references(() => users.id),
    schoolId: schoolId(),
    createdAt: timestamps.createdAt,
  },
  (t) => [unique().on(t.teacherId, t.date)]
);
```

> The `recordedByTeacherId` nullability change is a real schema migration on an existing table with existing data — write it as an explicit `ALTER COLUMN ... DROP NOT NULL`, and confirm no application code assumes it's always present (currently only read in `AttendanceRepository.saveRegister`'s upsert, which already always supplies it for the manual-entry path).

### Service / controller

New `src/server/services/attendance-import-service.ts` (shared by both target types), pure functions (unit-testable, no DB). Field names below map directly to the verified columns above (only what's needed — `Ketentuan`/`Pulang Cepat`/`Durasi Kerja` are parsed transiently for status inference but not persisted):
```ts
type FingerprintDay = {
  date: string;        // col A, DD/MM/YYYY as-is; convert to YYYY-MM-DD before persisting
  checkIn: string | null;   // col E, "HH.MM" → normalize "." to ":" for storage
  lateDuration: string | null; // col F — presence (not "-") ⇒ status "late"
  checkOut: string | null;  // col G
  masukKerja: "0" | "1";    // col J
  libur: "0" | "1";         // col K
  keterangan: string;       // col L — "", "Libur Rutin", or "Alpha" in the verified samples
};
type FingerprintBlock = { fingerprintId: string; name: string; days: FingerprintDay[] };

splitFingerprintBlocks(rows: unknown[][]): FingerprintBlock[]  // scans for "Nama:" rows to find block starts, "Tanggal" cell to find each block's data start, reads until a blank row
inferAttendanceStatus(day: FingerprintDay): AttendanceStatus | "skip"
matchBlocksToPeople<T extends { id: string; fingerprintId: string | null }>(
  blocks: FingerprintBlock[], people: T[]
): { matched: { block: FingerprintBlock; personId: string }[]; unmatched: FingerprintBlock[] }
```

`inferAttendanceStatus` — resolved from the verified truth table above (`libur`/`masukKerja`/`keterangan` combos), not guessed:
```ts
function inferAttendanceStatus(day: FingerprintDay): AttendanceStatus | "skip" {
  if (day.libur === "1") return "skip"; // non-schoolday — never persist a record for these
  if (day.masukKerja === "1") return day.lateDuration ? "late" : "present";
  // masukKerja === "0" && libur === "0"
  if (day.keterangan && day.keterangan.trim().toLowerCase() !== "alpha") return "excused"; // covers Izin/Sakit if a future export ever has them
  return "absent"; // "Alpha", or blank with no attendance
}
```

Service entry points:
```ts
AttendanceImportService.previewStudentImport(buffer: ArrayBuffer): Promise<PreviewResult>
AttendanceImportService.previewTeacherImport(buffer: ArrayBuffer): Promise<PreviewResult>
AttendanceImportService.confirmStudentImport(rows: {studentId: string; days: FingerprintDay[]}[], importedByUserId: string): Promise<ImportResult>
AttendanceImportService.confirmTeacherImport(rows: {teacherId: string; days: FingerprintDay[]}[], importedByUserId: string): Promise<ImportResult>
```

`confirmStudentImport` **reuses** `AttendanceRepository.saveRegister` (`attendance-repository.ts:54-68`) — extend its `AttendanceUpsert` type with `checkInTime?`, `checkOutTime?`, `importedByUserId?`, and make `recordedByTeacherId` optional in that type to match the schema change. Per-student `classId` is resolved from `students.currentClassId` at import time; a student with no current class is skipped into `failed[]`.

New `src/server/repositories/teacher-attendance-repository.ts` — `TeacherAttendanceRepository.saveRegister(entries)` (net-new, mirrors `AttendanceRepository.saveRegister`'s `insert...onConflictDoUpdate` exactly), `listForTeacher(teacherId)`.

`StudentRepository`/`TeacherRepository` — add `findByFingerprintId(id)`; setting the value on match reuses the existing generic `update()`.

New `src/server/controllers/attendance-import-controller.ts`:
- `previewStudentAttendanceImportAction(fileBase64: string)`, `previewTeacherAttendanceImportAction(fileBase64: string)` — `requireRole(["admin"])`. Client reads the uploaded `File` via `.arrayBuffer()` → base64 → passed as a string (binary analog of the existing "read client-side, pass a primitive, parse server-side" CSV pattern).
- `confirmStudentAttendanceImportAction(rows, manualMatches)`, `confirmTeacherAttendanceImportAction(rows, manualMatches)` — `requireRole(["admin"])`.

### New/changed files

- `src/lib/db/schema/attendance.ts` — extend `attendanceRecords`, add `teacherAttendanceRecords`
- `src/lib/db/schema/people.ts` / `academics.ts` — add `fingerprintId`
- `package.json` — add `xlsx`
- `drizzle/migrations/00XX_*.sql`
- `src/server/services/attendance-import-service.ts` (new)
- `src/server/repositories/teacher-attendance-repository.ts` (new)
- `src/server/repositories/attendance-repository.ts` — widen `AttendanceUpsert`
- `src/server/controllers/attendance-import-controller.ts` (new)
- `src/components/forms/attendance-import-flow.tsx` (new — shared, parameterized by `target: "student" | "teacher"` to avoid duplicating the two-stage UI)
- `src/components/tables/fingerprint-match-table.tsx` (new — manual-match UI for unmatched blocks)
- `src/app/(admin)/admin/attendance/import-students/page.tsx`, `.../import-teachers/page.tsx` (new)

## Edge cases

- Non-schoolday rows (weekends/holidays) in the export must not become spurious `"absent"` records — handled by keying off column K (`Libur` flag), not the `Keterangan` text, which is more robust than string-matching "Libur Rutin" (verified: `Libur` flag and `Keterangan` text always agree in both sample files, but the flag is the authoritative signal per the file's own semantics).
- Duplicate `fingerprintId` across two people — DB unique constraint catches it; surface a clear per-row error, not a 500.
- Re-importing the same month after a machine-side correction must be idempotent — both `saveRegister` calls are upsert-keyed on `(personId, date)`, so this is naturally safe.
- Sheet layout drift between fingerprint-machine firmware versions — `splitFingerprintBlocks` should fail loudly per-unrecognized-block in the preview stage rather than silently mis-parsing.
- Large file size vs. Cloudflare Workers' request-duration/CPU-time limit — explicitly a scaling risk to document, not solve now: *"if a monthly export exceeds roughly N staff × 31 days and approaches the Workers CPU-time limit, revisit with Cloudflare Queues."*

## Test plan

- vitest: `splitFingerprintBlocks` against a fixture 2D array modeling the stacked-block layout (multiple people, ragged day counts).
- vitest: `inferAttendanceStatus` — table-driven (present/late/absent/excused/non-schoolday-skip).
- vitest: `matchBlocksToPeople` — matched vs. unmatched by `fingerprintId`.
- e2e (Playwright): upload a small fixture `.xlsx` (checked into `tests/fixtures/`) as admin, manually resolve one unmatched block, confirm, then verify the resulting records on the student's/teacher's attendance history view.

## Open questions for client

1. Should imported teacher attendance ever feed payroll/salary logic (tying into TSD-02's `salarySource`/`employmentStatus`)? Recommend **no** — out of scope unless explicitly requested.
2. Both sample files are dominated by "check-in only, no check-out scan" days (`Absensi Pulang` blank almost everywhere, matching their own `Tidak Absen Keluar` stat) — confirm this is normal day-to-day machine behavior at this school (single scan on arrival) and not an artifact of this particular export window, since it means `checkOutTime` will be null for the vast majority of imported rows.
