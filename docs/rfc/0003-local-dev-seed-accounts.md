# RFC 0003: Local-Dev Seed Script + Accounts

- **Status**: Accepted
- **Date**: 2026-08-04
- **Author**: Abdul Majid Hamid (with Claude Code)

## Context

RFC 0001's Verification Approach called for a seed script ("1 academic year, few classes, ~10 students+guardians, 2-3 teachers") from Phase 1 onward, but `scripts/` was never populated — the dev database instead accumulated leftover rows from Playwright e2e runs pointed at it by mistake (`*@test.local`, `*.mailinator.com` identifiers, several with no email at all). There was no real, known-password account for any role.

## Decision

Added `scripts/seed.ts`, run via `bun run db:seed`. It calls the same `Service` layer the app itself uses (`AuthService.bootstrapAdmin`, `TeacherService.registerTeacher`, `StudentService.registerStudent`/`grantPortalAccess`, `GuardianService.grantPortalAccess`, `AcademicService.*`) rather than inserting rows directly — so seeded data goes through the same validation/hashing/transaction paths as production use, and stays correct if those services change shape.

It refuses to run against a database that already has an admin (`AuthService.adminExists()`), so it can't silently double-seed or overwrite a real school's data.

**Not part of the deploy path** — local dev only, per RFC 0001's Cloudflare/D1 production target. Re-run any time via:

```bash
psql "postgres://madani:madani@localhost:5433/postgres" -c "DROP DATABASE IF EXISTS madani_elearning;"
psql "postgres://madani:madani@localhost:5433/postgres" -c "CREATE DATABASE madani_elearning;"
bun run db:migrate
bun run db:seed
```

## Seed Data

**Update (2026-08-04, demo-scale expansion):** the script grew from a small 6-student smoke-test scenario into a full demo-scale dataset — every portal needs real content to click through for a client demo, and list pages needed enough rows to actually exercise `TablePagination` (`src/components/tables/table-pagination.tsx`, 20 rows/page) instead of always showing one short page.

Fictitious elementary school, 2 academic years (2025/2026 past, 2026/2027 current — the only one anything else attaches to), 7 subjects (Matematika, Bahasa Indonesia, IPA, IPS, PAI, Seni Budaya, PJOK), 6 classes (Kelas 1A–6A, full SD grade range) each with a homeroom teacher teaching the 5 core subjects, plus 2 specialist teachers (PJOK, Seni Budaya) teaching across all 6 classes — 8 teachers total. 30 students (5 per class), each with one linked guardian (30 guardians). Grade 3+ students get their own portal login (grade 1–2 don't, matching RFC 0001 "Roles & accounts" — young kids don't need one); every guardian gets one regardless of child's grade.

Fees: 6 fee structures (catalog), ~48 invoices across all students (SPP for everyone, Uang Gedung for ~1/3, Ekstrakurikuler for ~1/4) with payment status rotated across paid/partial/unpaid so `/admin/fees` and `/admin/fees/reminders` show a real spread of arrears (~32 outstanding), not a uniform state.

E-learning ("Modul" — see the Kursus→Modul rename elsewhere in this branch): 12 courses (2 per class, teacher's own subject), each with 2 themes/4 note-only content items, 1 assignment (submitted + partially graded by the class) and 1 quiz (4 mixed-type questions, attempted and auto-graded by every student in the class) — all via the real `CourseService`/`AssignmentService`/`QuizService`, same as a teacher would create by hand. Note: `AssignmentService.submit`/`gradeSubmission` and `QuizService.startAttempt`/`submitAttempt` stamp `new Date()` server-side with no override, so seeded submissions/attempts are all timestamped "today" rather than spread across a historical range — accepted, not worked around (would require bypassing the service layer just for timestamps).

Attendance: ~300 records — every class's homeroom teacher recording the last 10 weekdays for their own roster via `AttendanceService.saveRegister` (mostly "present", with "late"/"absent"/"excused" scattered in).

All emails/phones are fictitious (`@sdmadani.sch.id`, `@gmail.com`, `+6281...`) — not real people. Student/guardian names are generated from small first/last-name pools (see `scripts/seed.ts`), not hand-listed, so exact names will repeat across re-seeds in a different arrangement.

## Accounts (local dev only — regenerate, don't reuse elsewhere)

**Update (2026-08-04):** every account's password is now fixed, not the random temp password `registerTeacher`/`grantPortalAccess` generate — the seed script immediately overwrites it (`UserRepository.resetPassword`, same admin-forced-reset path the real app uses, not a new mechanism). This is a deliberate deviation from the real provisioning flow (which always mints a random one-time temp password) purely so demo credentials stay memorable and identical across re-seeds, instead of changing every run.

- **Admin**: `admin@sdmadani.sch.id` / `Admin#Madani2026`
- **Every teacher, student, and parent account**: password `Demo#Madani2026`

Teacher emails/NIPs and guardian emails are deterministic (built directly from the seed script's fixed teacher list / `firstName.lastName{index}` pattern), so they're stable across re-seeds. **Student usernames are not** — grade-3+ students without an email get a system-generated username (`generateUsername()`, includes a random numeric suffix for uniqueness), so their exact identifier changes on every `bun run db:seed` run. For the current run's exact student usernames (and the full ~59-account list, at this scale not worth reproducing here), read the console output — it's the source of truth for identifiers, not this file, since the password is now the only fixed part.

At this scale (~59 accounts: 1 admin + 8 teachers + 20 students + 30 guardians), representative examples:

| Role | Who | Login identifier |
|---|---|---|
| Admin | Tata Usaha | `admin@sdmadani.sch.id` |
| Teacher | Siti Nurhaliza — wali kelas 1A | `siti.nurhaliza@sdmadani.sch.id` or NIP `NIP-2026001` |
| Student | Dewi Saputra — Kelas 3A | e.g. `dewi.saputra328` — re-seed each time, read console output |
| Parent | Lina Saputra — ortu Dewi | `lina.saputra1@gmail.com` |

All non-admin accounts have `must_change_password = true`, matching the real provisioning flow (admin hands out a temp password, user is forced to change it at first login) — even though the password value itself is fixed here rather than randomly generated.

Verified against the running app and via direct service-layer checks (`AuthService.login`, `CourseService.coursesForStudentUser`, `FeeService.outstandingBalanceReport`, `AttendanceService.historyForStudent`, assignment/quiz grading results) — row counts and a handful of golden paths confirmed to match the design after each seed run. See commit history for this RFC.

## Security note

These are throwaway credentials for a local Postgres container seeded with fake people, gitignored `.env.local` DB connection, not reachable outside `localhost`. They're committed here only because the database they unlock is disposable and reproducible (`db:seed` regenerates it). Never seed this script against a shared/staging/production database, and never reuse `Admin#Madani2026` or `Demo#Madani2026` anywhere real.
