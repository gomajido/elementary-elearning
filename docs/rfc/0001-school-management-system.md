# RFC 0001: Elementary School Management System

- **Status**: Accepted
- **Date**: 2026-07-28
- **Author**: Abdul Majid Hamid (with Claude Code)

## Context

Elementary school (age 5-12) needs a single system covering student registration, student management, student payment tracking, e-learning, teacher management, and attendance. Goal is a solo-maintainable build at $0 hosting cost, single school today, schema designed so a future multi-tenant SaaS conversion doesn't require a rewrite.

## Decisions

### Stack
- **Framework**: Next.js (App Router, TypeScript), single repo
- **Package manager / test runner**: Bun (`bun install`, `bun run`, `bun test`/vitest). Bun does not run in production — deploy runs on Cloudflare's `workerd` runtime via Wrangler/OpenNext. Bun is local tooling speed only.
- **UI**: Tailwind CSS + shadcn/ui (copy-in components, no added runtime dependency, keeps Worker bundle small)
- **Hosting**: Cloudflare Workers via `@opennextjs/cloudflare`, not `@cloudflare/next-on-pages`. The latter is Edge-runtime-only and blocks Node APIs, full middleware, and streaming server actions. OpenNext runs the Node runtime inside Workers and is Cloudflare's endorsed forward path.
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM. Free, native to Workers, no external account needed.
- **File storage**: Cloudflare R2 for video/PDF content. Browser uploads directly to R2 via presigned URLs generated with `aws4fetch` (the full AWS SDK depends on Node APIs unavailable on Workers).
- **Auth**: hand-rolled. PBKDF2 password hashing via Web Crypto (`crypto.subtle.deriveBits` — no native-binding risk on Workers), random session token with only its SHA-256 hash stored server-side, httpOnly/secure/sameSite=lax cookie. No NextAuth/better-auth for MVP — requirements are narrow (4 static roles, no OAuth, no passwordless).

### Backend architecture: Controller → Service → Repository
- **Repository** (`src/server/repositories/*.ts`): Drizzle/D1 access only, no business logic.
- **Service** (`src/server/services/*.ts`): business logic, validation, multi-repository orchestration, RBAC-aware operations, `db.batch()` atomic write grouping.
- **Controller** (`src/server/controllers/*.ts`): thin entry points bound to Server Actions (`"use server"`) and API route handlers — parse/validate (Zod), call service, shape response/redirect.
- Call chain: Page/Server Action → Controller → Service → Repository → D1. Reads for Server Components also go through the Service layer so RBAC row-filtering isn't duplicated in a separate read path.

### Roles & accounts
Admin (registrar/office), Teacher, Student, Parent/Guardian. No public self-registration — admin provisions all accounts. Students may have a nullable `userId` since young kids don't necessarily need their own login.

### Payments
Offline only (bank transfer/cash). Admin manually records a payment against an invoice. Invoice balance is always *derived* from the payment ledger, never a stored mutable field, to avoid drift. Printable receipt view. No payment gateway integration.

### Tenancy
Single school for now. Every top-level table carries a `schoolId` column defaulted to `'default'` from day one, to avoid a painful backfill/migration if the system is later sold to multiple schools.

## Repo Structure

```
elearning/
  src/
    app/
      (public)/page.tsx        # branding landing page
      (public)/login/page.tsx
      (admin)/admin/*, (teacher)/teacher/*, (student)/student/*, (parent)/parent/*
      api/auth/{login,logout,register}, api/uploads/presign
    components/
      ui/       (shadcn/ui)
      landing/  (Hero, About, Programs, ContactCTA)
    lib/
      auth/{session.ts,password.ts,rbac.ts}
      db/{index.ts, schema/*.ts}
      r2/client.ts
      validation/*.ts (zod)
    server/
      controllers/*.ts
      services/*.ts
      repositories/*.ts
  drizzle/migrations/, drizzle.config.ts
  wrangler.jsonc
  middleware.ts
```

## Database Schema (Drizzle, SQLite dialect)

Conventions: UUID text primary keys (`crypto.randomUUID()`), money stored as integer cents, soft delete via nullable `deletedAt`, `schoolId` on every top-level table, dates stored as `YYYY-MM-DD` strings where time-of-day is irrelevant (DOB, attendance date, due dates) to avoid timezone off-by-one bugs.

Tables: `users`, `teachers`, `students`, `guardians`, `student_guardians`, `academic_years`, `classes`, `subjects`, `teacher_subject_assignments`, `enrollments`, `attendance_records`, `fee_structures`, `invoices`, `invoice_line_items`, `payments`, `courses`, `course_content_items`, `assignments`, `assignment_submissions`, `quizzes`, `quiz_questions`, `quiz_question_options`, `quiz_attempts`, `quiz_answers`, `sessions`.

No persisted `grades` table for MVP — grade summaries are computed at read time from `assignment_submissions` + `quiz_attempts`. A `report_cards` snapshot table is deferred until a later phase needs frozen printable term reports.

## Auth Design

1. PBKDF2 via `crypto.subtle.deriveBits` for password hashing.
2. Login generates a random 32-byte token; only its SHA-256 hash is stored in `sessions`; the raw token is set as an httpOnly/secure/sameSite=lax cookie.
3. Two-layer check: `middleware.ts` does a cheap cookie-presence redirect; `getCurrentUser()` does the authoritative per-request D1-backed validation inside layouts/actions.
4. `requireRole(user, [...])` centralizes RBAC checks, called at the top of every protected page/action.
5. A daily cron trigger prunes expired sessions.
6. Cookies are always set-then-redirect (never set-and-read within the same request) — same-request cookie propagation is a known rough edge on Workers.

## UI/UX Guidelines (kid users, age 5-12)

Admin/teacher/parent views stay dense and professional (tables, forms). The **student portal** must be kid-friendly:
- Large tap targets (44px minimum), large readable font, generous spacing
- Icon+color subject/course cards instead of text-heavy lists
- Illustrated/avatar-based feedback instead of plain toasts
- Limited bright palette via shadcn theme tokens; cards instead of dense tables
- Large-button quiz UI, clear progress indicator, labeled navigation
- Short, plain-language instructional copy
- Mobile/tablet-first responsive
- Baseline accessibility: color contrast, alt text, keyboard nav

## Route/Module Breakdown

- **Public landing** (`/`): hero, about/mission, programs, admissions CTA, contact, link to `/login`
- **Admin**: dashboard, students, teachers, classes/subjects/academic years, attendance overview, fees, user accounts
- **Teacher**: dashboard, classes/roster, daily attendance register, course content authoring, assignment grading, quiz builder
- **Student**: dashboard, course content, assignment submission, quiz-taking, grades, own attendance
- **Parent**: dashboard, per-child grades/attendance/fees (view + printable receipt only)

## Phased Roadmap

1. **Foundation** — scaffold, D1/R2 bindings, deploy pipeline proven end-to-end; landing page; auth+RBAC+admin bootstrap; academic years/classes/subjects; teacher CRUD+assignment; student registration+guardian linking+management
2. **Attendance + Fees** — daily register, attendance reports; fee structures, invoice generation, manual payment recording, receipts, outstanding balance report; parent portal (read-only)
3. **E-learning content + assignments** — R2 presigned upload flow, course/content authoring+viewing, assignment submit+grade
4. **Quizzes + grade reporting** — quiz builder, timed student quiz-taking, auto-grading, aggregate grade views

Post-MVP (not now, schema allows it later): CSV bulk import, SMS/email reminders, report-card PDF export, multi-tenant activation, analytics.

## Key Risks / Gotchas

- D1 has no real multi-statement transactions — use `db.batch()` for atomic writes (invoice+line-items, payment+status)
- Never proxy file uploads through the Worker — always direct browser→R2 via presigned URL
- R2 bucket needs explicit CORS configuration before uploads work
- Apply migrations via `wrangler d1 migrations apply --local` then `--remote` — not `drizzle-kit migrate` directly
- D1 free-tier row-read/write caps — avoid N+1 query patterns
- Vet any npm package for Workers Node-API compatibility before adopting
- Watch Worker bundle size; shadcn/ui's copy-in model helps

## Verification Approach

- Local-first loop via `wrangler dev` against local D1/R2 emulation
- Migration ritual: `drizzle-kit generate` → inspect diff → apply `--local` → smoke test → apply `--remote`
- Seed script from Phase 1 onward (1 academic year, few classes, ~10 students+guardians, 2-3 teachers)
- Manual 4-role smoke checklist after every phase — verify no cross-student/cross-role data leaks
- `vitest` unit tests for fee/invoice balance calc, quiz auto-grading, attendance aggregation
- Unit tests on `requireRole()`/`getCurrentUser()` and any query filtered by studentId/schoolId
- Real `wrangler deploy` to free-tier Cloudflare after every phase
- Hand-verify computed balances against sample data for the fees module specifically

## Amendments

Future architectural changes are appended as new numbered RFCs (`0002-...`) rather than edits to this document's history.
