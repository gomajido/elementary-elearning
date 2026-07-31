# SD Madani — Elementary School Management System

Student registration, student management, attendance, fees/payments, teacher management, and e-learning (courses, assignments, quizzes) for an elementary school. Built with Next.js, Drizzle ORM, and Postgres.

**UI language: Bahasa Indonesia.** All screens (landing page, admin/teacher/student/parent portals, error/status messages) are in Indonesian — the school's actual users. DB enum values (`role`, `status`, etc.) stay in English as internal identifiers; only what's displayed is translated, centrally in `src/lib/labels.ts`. Code, comments, commits, and this README stay in English.

See [`docs/rfc/0001-school-management-system.md`](docs/rfc/0001-school-management-system.md) for the original architecture/design decisions, and [`docs/rfc/0002-postgres-and-local-docker.md`](docs/rfc/0002-postgres-and-local-docker.md) for why the data layer runs on Postgres rather than Cloudflare D1.

## Stack

- **Framework**: Next.js (App Router, TypeScript), package manager **Bun**
- **UI**: Tailwind CSS + shadcn/ui
- **Database**: Postgres via Drizzle ORM (`drizzle-orm/postgres-js`)
- **File storage**: S3-compatible (MinIO locally; R2 or S3 in prod)
- **Backend architecture**: Controller → Service → Repository, per domain

## Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose (for local Postgres/MinIO/Mailpit/WAHA)

## Local setup

```bash
# 1. Install dependencies
bun install

# 2. Start Postgres, MinIO, Mailpit (local email inbox), and WAHA (WhatsApp)
docker compose up -d

# 3. Configure env vars (defaults already match docker-compose.yml)
cp .env.example .env.local

# 4. Apply the database schema
bun run db:migrate

# 5. Run the app
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page is public; `/setup` does one-time admin account creation (refuses once an admin exists — see RFC 0001 "Auth Design"). Every other account (teachers, students, parents) is provisioned by the admin from inside the app, each with a one-time temp password shown on screen.

### WhatsApp reminders setup (one-time)

Fee-payment reminders go out over WhatsApp (fallback: email) from `/admin/fees/reminders`. Email works out of the box locally — sent mail lands in Mailpit's inbox at [http://localhost:8025](http://localhost:8025), no further setup. WhatsApp needs a real number linked once per environment:

1. Open the WAHA dashboard at [http://localhost:3001](http://localhost:3001).
2. Start the `default` session and scan the QR code with the WhatsApp account that should send reminders.
3. The session persists in the `waha_data` volume, so this only needs to happen once per environment (not per `docker compose up`).

The channel is picked once per guardian, not retried on failure: a guardian with a phone number on file always gets WhatsApp; email is only used when there's no usable phone number. Without a linked WAHA session, WhatsApp sends fail outright — the reminders page will show the failure per row.

## Running tests

```bash
# Unit tests (pure logic: fee balance calc, quiz auto-grading normalization)
bun run test        # NOT `bun test` — that runs Bun's own runner over the
                    # Playwright specs too, which then error out
```

The e2e suite exercises the full golden path per role: admin sets up an academic year/class/teacher/student, teacher builds a course/assignment/quiz and grades work, student submits and takes the quiz, parent views the child's attendance/fees/grades — with an explicit check that a parent can't view another family's student (RBAC boundary).

It runs against **its own database**, not your dev one. The first test bootstraps the admin via `/setup`, which refuses once any admin exists — so pointed at a database you've already clicked around in, the whole suite dead-ends on step one.

```bash
bunx playwright install chromium   # first time only

# One-time: create the e2e database
psql "postgres://madani:madani@localhost:5433/postgres" -c "CREATE DATABASE madani_elearning_e2e;"

export E2E_DB="postgres://madani:madani@localhost:5433/madani_elearning_e2e"
DATABASE_URL=$E2E_DB bun run db:migrate
DATABASE_URL=$E2E_DB bun run dev &   # must be running; playwright reuses it
bun run test:e2e
```

To start over from scratch, `DROP DATABASE madani_elearning_e2e` and repeat. The suite otherwise suffixes its records per run, so consecutive runs against the same database don't collide.

## Database changes

```bash
# 1. Edit a schema file under src/lib/db/schema/
# 2. Generate a migration
bun run db:generate

# 3. Inspect the generated SQL in drizzle/migrations/ before applying
# 4. Apply it
bun run db:migrate
```

`bun run db:studio` opens Drizzle Studio (a GUI) against your local database.

## Project structure

```
src/
  app/            # Next.js routes, grouped by role: (public), (admin), (teacher), (student), (parent)
  components/     # ui/ (shadcn), forms/, landing/, layout/
  lib/            # auth/, db/ (schema + client), storage/ (S3 client), validation helpers
  server/
    controllers/  # thin Server Actions — parse/validate input, call service, shape response
    services/     # business logic, RBAC checks, transaction orchestration
    repositories/ # Drizzle queries only, no business logic
docs/rfc/         # architecture decisions, one file per RFC, numbered and never edited after acceptance
docker-compose.yml
```

## Environment variables

See [`.env.example`](.env.example). `DATABASE_URL` and the `S3_*` vars are the only required configuration for local dev.
