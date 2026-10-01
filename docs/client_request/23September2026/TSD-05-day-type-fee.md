# TSD-05 — Half-Day / Full-Day Fee Flag

Source: `docs/client_request/23September2026/request-list.md` item 6.

## Problem

Client request (verbatim): *"Pembayaran half day dan full day tetap setiap bulan. anak2 bisa di flag apakah dia full day atau half day."*

Restated: each student can be flagged full-day or half-day; the monthly fee amount should differ accordingly.

## Current state

- `feeStructures` (`src/lib/db/schema/fees.ts:12-24`): `name, academicYearId, gradeLevel (nullable int — "some fees apply to one grade only"), amountCents, frequency`. **No day-type/session dimension today.**
- Fee generation is **100% manual**, no cron/automated job anywhere (grepped, only an unrelated MVP comment in `auth-service.ts:27`). Entry point: `generateInvoiceAction` (`src/server/controllers/fee-controller.ts:88-135`) — admin picks `target: "student" | "class"` and `feeStructureIds`, the controller resolves `feeStructureIds` → `lineItems` (`fee-controller.ts:102-106`) and passes the **same `lineItems` array to every student in the class** — `FeeService.generateInvoicesForClass` (`src/server/services/fee-service.ts:62-87`) has **zero per-student branching today**.
- `students` schema (`src/lib/db/schema/people.ts:26-46`) has no day-type/session field.
- Enum-on-row convention: `$type<X>()` column + exported `const X_VALUES` array + label map in `src/lib/labels.ts` (e.g. `GENDERS`/`GENDER_LABELS`, `ENROLLMENT_STATUSES`/`ENROLLMENT_STATUS_LABELS`).

## Design

### Schema

```ts
// src/lib/db/schema/people.ts
export const DAY_TYPES = ["full_day", "half_day"] as const;
export type DayType = (typeof DAY_TYPES)[number];

// added to students:
dayType: text("day_type").notNull().$type<DayType>().default("full_day"),
```
`NOT NULL DEFAULT 'full_day'` — matches the `enrollmentStatus.default("active")` precedent (`people.ts:37-40`) and backfills every existing row automatically on migration, avoiding a nullable-everywhere ripple through fee-generation logic.

Named `dayType`, not `attendanceType` — avoids colliding conceptually with the existing attendance-status vocabulary (`AttendanceStatus` in `src/lib/db/schema/attendance.ts:7-8` — present/absent/late/excused is a different concept entirely).

```ts
// src/lib/db/schema/fees.ts — added to feeStructures:
dayType: text("day_type").$type<DayType>(), // nullable = applies to both, mirrors the existing nullable gradeLevel design
```

`src/lib/labels.ts`: add `DAY_TYPE_LABELS = { full_day: "Full Day", half_day: "Half Day" }`.

### Service / controller

- `src/lib/validation/student.ts` (`studentSchema`) and `src/server/controllers/student-controller.ts` (`updateStudentSchema`, lines 70-80) both get `dayType: z.enum(DAY_TYPES)` — exactly how `enrollmentStatus` was added to the update schema (`student-controller.ts:79`).
- `src/server/repositories/student-repository.ts` — `NewStudent`/`StudentUpdate` types (lines 6-17) get `dayType?: DayType`.
- `src/server/repositories/fee-repository.ts` — `FeeStructureRepository.create`/`update` input types (lines 21-27, 33-41) get `dayType?: DayType | null`.
- `src/server/controllers/fee-controller.ts` — `feeStructureSchema` (lines 14-20) gets `dayType: z.enum(DAY_TYPES).optional()`, same pattern as the existing `gradeLevel: z.coerce.number().int().min(0).max(12).optional()` (line 19).
- **The one non-trivial change**: `FeeService.generateInvoicesForClass` (`fee-service.ts:62-87`) changes from taking pre-resolved `lineItems: NewInvoiceLineItem[]` to taking `feeStructureIds: string[]` and resolving matching structures **per student** internally:

```ts
// BEFORE
async generateInvoicesForClass(input: { classId, academicYearId, issueDate, dueDate, lineItems: NewInvoiceLineItem[] })

// AFTER
async generateInvoicesForClass(input: {
  classId: string; academicYearId: string; issueDate: string; dueDate: string;
  feeStructureIds: string[];
})
```

  Internally: fetch `FeeStructureRepository.list()` once (small table, matches the existing "aggregate in JS" convention used elsewhere, e.g. `outstandingBalanceReport`), then per student compute:
  ```ts
  const lineItems = feeStructureIds
    .map((id) => structures.find((s) => s.id === id))
    .filter((s) => s && (s.dayType === null || s.dayType === student.dayType))
    .map((s) => ({ feeStructureId: s.id, description: s.name, amountCents: s.amountCents }));
  ```
  If a student ends up with zero matching line items, push them to a `failed[]` entry instead of creating a zero-item invoice for them (this is the actual behavior change vs. today's whole-class upfront throw at `fee-service.ts:69`).

- `src/server/controllers/fee-controller.ts`'s `generateInvoiceAction` (lines 88-135) — for `target === "class"`, delete the pre-resolution block (lines 102-106) and pass `feeStructureIds` straight through to the service. The `target === "student"` branch (`generateInvoiceForStudent`, unchanged) keeps resolving `lineItems` in the controller exactly as today — the admin already knows that one student's `dayType` when hand-picking structures for a one-off invoice.

### New/changed files

- `src/lib/db/schema/people.ts` — add `dayType` + `DAY_TYPES`/`DayType`
- `src/lib/db/schema/fees.ts` — add `feeStructures.dayType`
- `drizzle/migrations/00XX_*.sql`
- `src/lib/labels.ts` — `DAY_TYPE_LABELS`
- `src/lib/validation/student.ts`, `src/server/controllers/student-controller.ts` — add `dayType` fields
- `src/server/repositories/fee-repository.ts`, `student-repository.ts` — widen types
- `src/server/services/fee-service.ts` — change `generateInvoicesForClass` signature/logic
- `src/server/controllers/fee-controller.ts` — update `feeStructureSchema` and `generateInvoiceAction`
- `src/components/forms/student-form.tsx` / `edit-student-form.tsx` — add a `dayType` select
- Fee-structure admin form — add optional `dayType` select

## Edge cases

- Existing fee structures all default to `dayType: null` (applies to both) — zero behavior change for current data until an admin explicitly creates a half/full-day-specific structure.
- A student with no matching fee structure for their `dayType` when generating class invoices → per-student skip with a clear reason surfaced in the UI, not a whole-class abort.
- Changing `students.dayType` mid-year does **not** retroactively touch already-issued invoices — only affects future `generateInvoicesForClass` runs. Call this out explicitly in the UI, since an admin might expect a retroactive adjustment.
- `generateInvoiceForStudent` (manual single-student path) intentionally stays unenforced by default (see open question below) — preserves the admin's existing freedom to bill one-off/exception charges.

## Test plan

- vitest: extract a pure `selectLineItemsForStudent(structures, selectedIds, studentDayType): NewInvoiceLineItem[]` — matrix test (full_day student × full_day/half_day/null structure; half_day student × same three; a structure not in `selectedIds` is always excluded). Place alongside the existing `summarizeInvoice` tests in `src/server/services/__tests__/fee-service.test.ts`.
- e2e (Playwright): admin creates a full-day and a half-day tuition fee structure for the same grade, flags one student half-day and one full-day in that class, runs "generate invoices for class," and asserts each student's invoice contains the correct single line item and amount.

## Open questions for client

1. Should the single-student manual invoice path (`generateInvoiceForStudent`) hard-enforce the `dayType`/fee-structure match, or stay a free admin choice as today (recommended)?
