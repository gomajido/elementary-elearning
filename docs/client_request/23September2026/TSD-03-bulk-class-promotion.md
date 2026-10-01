# TSD-03 — Bulk Class Promotion

Source: `docs/client_request/23September2026/request-list.md` item 3.

## Problem

Client request (verbatim): *"Grup siswa di kelas tertentu bisa di upgrade bulk menuju kelas yg lebih tinggi."*

Restated: admin should be able to bulk-promote a whole class's students into a higher grade class for the new academic year, in one action.

## Current state

- `academicYears` (`src/lib/db/schema/academics.ts:6-15`): `name, startDate, endDate, isCurrent`. `AcademicYearRepository.unsetCurrent()` (`src/server/repositories/academic-repository.ts:42-45`) flips all rows non-current — used when advancing the "current" year.
- `classes` (`academics.ts:43-56`): `name, section, gradeLevel (0-6), academicYearId, classTeacherId, capacity`. **`capacity` is not enforced anywhere today** (no check on insert/update/enrollment).
- A student's class is tracked in **two places**: `students.currentClassId` (denormalized fast pointer, `src/lib/db/schema/people.ts:36`) and `enrollments` (per-academic-year history, `people.ts:94-112`, unique on `(studentId, academicYearId)`).
- `enrollments.status` (`EnrollmentRecordStatus`, `people.ts:82-89`) already has `"promoted"` and `"repeated"` values — **defined but never written anywhere in the codebase today**. This enum was clearly built in anticipation of exactly this feature.
- **No promote/upgrade function exists** — grepped `academic-repository.ts` and `student-repository.ts`, no `promote`/`upgrade` anywhere.
- Existing bulk-operation pattern to mirror: `FeeService.generateInvoicesForClass` (`src/server/services/fee-service.ts:62-87`) — loads the class roster via `StudentRepository.listByClass(classId)` (`src/server/repositories/student-repository.ts:91-98`), then loops with **one atomic write per student**, not one giant transaction (matches the "one row failing doesn't block the rest" philosophy also seen in `confirmTeacherImportAction`, `src/server/controllers/teacher-import-controller.ts:26-43`).
- Promotion is admin-only (no per-teacher-class-ownership check needed, unlike `AttendanceService.saveRegister` which checks `classRow.classTeacherId === teacher.id`, `src/server/services/attendance-service.ts:34-37`).

## Design

No new schema — reuses `enrollments.status`'s existing `"promoted"`/`"repeated"`/`"withdrawn"` values.

### Service

`src/server/repositories/student-repository.ts` — extend `EnrollmentRepository` (net-new methods, existing `create`/`listAll` untouched):
```ts
findByStudentAndYear(studentId: string, academicYearId: string, tx?: Queryable)
updateStatus(id: string, status: EnrollmentRecordStatus, tx?: Queryable)
```

`src/server/services/academic-service.ts` — add (net-new):
```ts
type PromotionOverride = { studentId: string; action: "promote" | "repeat" | "withdraw"; toClassId?: string };

async promoteClassBulk(input: {
  fromClassId: string;
  toAcademicYearId: string;
  defaultToClassId: string;
  enrolledAt: string; // YYYY-MM-DD
  overrides?: PromotionOverride[]; // students not listed default to "promote" into defaultToClassId
}): Promise<{ succeeded: { studentId: string; action: string }[]; failed: { studentId: string; error: string }[] }>
```

Implementation, mirroring `generateInvoicesForClass`'s shape:
1. `StudentRepository.listByClass(fromClassId)` for the roster.
2. Resolve `fromAcademicYearId` from `ClassRepository.findById(fromClassId).academicYearId` (`academic-repository.ts:93-101`).
3. Per student, in one `db.transaction`:
   - Look up the old enrollment row via `EnrollmentRepository.findByStudentAndYear`.
   - `"withdraw"`: set that row's status `"withdrawn"`, set `students.currentClassId = null`, `students.enrollmentStatus = "withdrawn"`.
   - `"promote"` / `"repeat"`: set the old row's status accordingly, `EnrollmentRepository.create` a new row for `(toAcademicYearId, toClassId)` with status `"active"`, update `students.currentClassId`.
4. Catch per-student errors (e.g. re-running promotion twice hits the `enrollments(studentId, academicYearId)` unique constraint) into `failed[]` instead of aborting the batch.

New `src/server/controllers/promotion-controller.ts` (kept separate from `academic-controller.ts` — a distinct workflow, not CRUD):
- `rosterForPromotionAction(classId: string)` — loads roster + each student's current enrollment status, for the override UI.
- `promoteClassAction(input)` — `requireRole(["admin"])`, called directly from a client component (not a `<form action>`, since the input is an array of per-row overrides that doesn't map onto `FormData` — same invocation style as `confirmTeacherImportAction(preview.valid)` in `teacher-import-flow.tsx:59`).

### New/changed files

- `src/server/repositories/student-repository.ts` — extend `EnrollmentRepository`
- `src/server/services/academic-service.ts` — add `promoteClassBulk`
- `src/server/controllers/promotion-controller.ts` (new)
- `src/components/forms/promote-class-flow.tsx` (new — roster table with a per-row promote/repeat/withdraw select + target-class override, same two-stage shape as `teacher-import-flow.tsx`)
- `src/app/(admin)/admin/classes/promote/page.tsx` (new)

## Edge cases

- Held-back (`"repeat"`) students need an explicit `toClassId` override (usually a same-grade class in the new year) — validate this is present for every `"repeat"` row before submitting.
- Re-running promotion on an already-promoted class is idempotent-safe: the `enrollments(studentId, academicYearId)` unique constraint turns a duplicate run into per-student `failed[]` entries, not silent double-writes.
- A student in the roster with no existing enrollment row for `fromAcademicYearId` (data inconsistency) fails gracefully per-student, not crashing the batch.
- `classes.capacity` is not enforced anywhere today; promotion doesn't check it either by default (see open question).
- Promotion does **not** touch `academicYears.isCurrent` — that stays a separate, existing lever (`AcademicService.createAcademicYear`/`updateAcademicYear`, `academic-service.ts:11-19`). Don't conflate the two operations.

## Test plan

- vitest: extract the pure branching logic — `resolvePromotionPlan(roster: {id}[], overrides: PromotionOverride[], defaultToClassId: string)` → `{studentId, action, toClassId}[]` — table-driven (default promote, explicit repeat with target, explicit withdraw, missing `toClassId` on a `"repeat"` row is an error).
- e2e (Playwright): admin creates class A (year 1, 3 students), class B (year 2), promotes with one student withdrawn and one held back into a third class, then asserts `currentClassId`/enrollment history for all three via the UI.

## Open questions for client

1. Who is authorized to override a held-back/withdrawn student — admin only (recommended, matches "promotion is admin-only"), or should homeroom teachers give input first?
2. Should target-class `capacity` be enforced (even as a soft warning) during promotion? Not enforced anywhere in the system today — recommend leaving it unenforced for v1 unless the client specifically wants it.
