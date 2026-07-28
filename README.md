# Madani Elementary School Management System

Student registration, student management, attendance, fees/payments, teacher management, and e-learning (courses, assignments, quizzes) for an elementary school. Built with Next.js, Drizzle ORM, and Postgres.

See [`docs/rfc/0001-school-management-system.md`](docs/rfc/0001-school-management-system.md) for the original architecture/design decisions, and [`docs/rfc/0002-postgres-and-local-docker.md`](docs/rfc/0002-postgres-and-local-docker.md) for why the data layer runs on Postgres rather than Cloudflare D1.

## Stack

- **Framework**: Next.js (App Router, TypeScript), package manager **Bun**
- **UI**: Tailwind CSS + shadcn/ui
- **Database**: Postgres via Drizzle ORM (`drizzle-orm/postgres-js`)
- **File storage**: S3-compatible (MinIO locally; R2 or S3 in prod)
- **Backend architecture**: Controller → Service → Repository, per domain

## Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose (for local Postgres/MinIO)

## Local setup

```bash
# 1. Install dependencies
bun install

# 2. Start Postgres + MinIO
docker compose up -d

# 3. Configure env vars (defaults already match docker-compose.yml)
cp .env.example .env.local

# 4. Apply the database schema
bun run db:migrate

# 5. Run the app
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page is public; `/setup` does one-time admin account creation (refuses once an admin exists — see RFC 0001 "Auth Design"). Every other account (teachers, students, parents) is provisioned by the admin from inside the app, each with a one-time temp password shown on screen.

## Running tests

```bash
# Unit tests (pure logic: fee balance calc, quiz auto-grading normalization)
bun test

# End-to-end tests (Playwright, drives a real browser against the running app)
bunx playwright install chromium   # first time only
bun run dev &                       # app must be running
bun run test:e2e
```

The e2e suite exercises the full golden path per role: admin sets up an academic year/class/teacher/student, teacher builds a course/assignment/quiz and grades work, student submits and takes the quiz, parent views the child's attendance/fees/grades — with an explicit check that a parent can't view another family's student (RBAC boundary).

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
