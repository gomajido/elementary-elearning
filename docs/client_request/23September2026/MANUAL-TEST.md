# Manual test guide — 23 Sep 2026 client request batch (TSD-01..05)

Covers the five features from this batch. Automated tests (86 vitest cases) already cover the pure logic — fee line-item selection, promotion resolution, fingerprint block splitting, registration validation. What they cannot cover is the composed path through the browser, which is exactly where the one real bug in this batch was found (a transaction that read its own uncommitted insert on a separate connection). So this guide is deliberately UI-driven, with a database check after each step.

Budget roughly 60–90 minutes for the full pass.

---

## Read this first: where to test

**Do the functional testing locally, not in production.** Production holds real school data — 31 students, 10 teachers, 62 users, 300 attendance records. Every test below creates or mutates records, and there is no undo in the UI for most of them. A promotion in particular rewrites an entire class roster.

Exactly one thing cannot be tested locally: **the real Turnstile widget**. Its site key is scoped to `app.ismadani.sch.id` only, so it will not render or validate anywhere else. Local `/register` falls back to Cloudflare's always-pass test keys from `.env.local`, which exercises the full form and approval flow but proves nothing about bot protection.

That gives two passes:

| Pass | Where | What it proves |
|---|---|---|
| A — functional | local | all five features actually work |
| B — Turnstile | `https://app.ismadani.sch.id/register` | the real widget renders and a real token verifies |

Pass B is the only part that touches production, and it is narrow. Details in its own section at the end.

---

## Local setup

```sh
docker compose up -d          # postgres, minio, mailpit
bun run db:migrate            # no-op if already applied
bun run dev
```

Open `http://localhost:3000`.

Two things about the local database, both from the previous session:

- It already contains disposable test data — duplicate "Budi Santoso Junior" applications, a test academic year 2027/2028, fingerprint-imported attendance rows, students with fake NIK/NISN. Harmless, but do not be surprised by it. For a clean slate: `docker compose down -v`, then `bun run db:migrate` and `bun run db:seed`.
- The admin login used previously was `admin@sdmadani.sch.id` / `TestPass123!`. That password was set by a direct database update rather than through signup, so it is local-only and may no longer be there. If it fails, use your own admin account or re-seed.

If Postgres starts refusing connections with `too many clients already` partway through — a known local-only artifact of Turbopack hot-reload churn, not an app bug — run `docker compose restart postgres` and restart `bun run dev`.

For the SQL checks below:

```sh
psql postgres://madani:madani@localhost:5433/madani_elearning
```

**Run the tests in the order given.** TSD-03 is last on purpose: promoting a class empties its roster, which would invalidate the earlier fixtures.

---

## TSD-05 — Full-day / half-day fee

What should happen: each student is full-day or half-day, and invoice generation gives each student only the fee lines matching their day type, plus any fee line that applies to everyone.

1. **Siswa** → create a student. The form now has a **Tipe hari** field — set it to **Half Day**.
2. **Biaya → Struktur biaya**. Create three fee structures:
   - one with **Tipe hari** = `Full Day`
   - one with **Tipe hari** = `Half Day`
   - one leaving it blank ("Semua tipe hari")
3. **Biaya → Tagihan**. Generate invoices for the class holding your half-day student, ticking **all three** fee structures.

**Expected:** the half-day student's invoice has exactly two line items — the half-day fee and the all-types fee. The full-day fee must be absent. Full-day students in the same class get the full-day fee and the all-types fee.

```sql
select s.full_name, s.day_type, fs.name, fs.day_type as fee_day_type
from invoices i
join students s on s.id = i.student_id
join invoice_line_items li on li.invoice_id = i.id
join fee_structures fs on fs.id = li.fee_structure_id
order by s.full_name;
```

**Also check the regression this feature caused once and could cause again:** go to **Siswa → Impor CSV** and import a file using the existing template. It must still work. `studentSchema` is shared with the CSV parser, and adding a required `dayType` to it broke bulk import until `csvRowSchema` explicitly omitted the field. Any future required field on `studentSchema` or `teacherSchema` needs the same treatment.

---

## TSD-02 — Teacher Dapodik profile

What should happen: teachers carry the Dapodik F-PTK core profile, edited through a path entirely separate from the normal teacher edit.

1. **Guru** → row menu → **Data Dapodik**.
2. Fill a spread of fields across the sections — identity (NIK, NUPTK, place/date of birth), employment (`ptkType`, employment status, NIY/NIGK), assignment, and the special-needs competency fields. All are optional by design, so partial fills are valid.
3. Save, reopen, confirm the values persisted.

**Then test the separation explicitly**, because this is the part most likely to regress: on the same teacher, use the *normal* edit action and change the **Nomor induk pegawai** (`employeeNumber`). That path owns a side effect the Dapodik path must not touch — it syncs to `users.username`.

```sql
select t.full_name, t.employee_number, u.username, t.nip, t.nuptk, t.ptk_type
from teachers t join users u on u.id = t.user_id
where t.nuptk is not null;
```

**Expected:** `employee_number` and `username` stay in sync after the normal edit; the Dapodik fields are untouched by it; and saving the Dapodik form never changes `username`. Note `nip` and `employee_number` are deliberately different columns — most staff are GTY/PTY/Honorer with no real NIP, so do not expect them to match.

Out of scope by the client's own choice: the ~15 repeating "Riwayat" history tables (career, salary, rank, education, certification) and the children/scholarships/training/publications/awards sub-tables. Their absence is not a bug.

---

## TSD-04 — Fingerprint attendance import

Use the client's real sample files, not invented ones:

- students → `docs/client_request/23September2026/4.ss.xlsx`
- teachers → `docs/client_request/23September2026/5.sg.xlsx`

1. **Kehadiran** → **Impor kehadiran dari mesin fingerprint (Excel)**.
2. Upload `4.ss.xlsx`. The preview lists each person block found in the file, with **Nama di Mesin**, **ID Fingerprint**, **Jumlah Hari**, and a **Cocokkan dengan** picker.
3. Match at least two blocks to real students. Matching is explicit and deliberate — there is no fuzzy name matching. The chosen `fingerprintId` is stored on the person, so later imports match automatically.
4. Confirm the import.
5. Repeat with `5.sg.xlsx` against teachers.

**Expected:** attendance rows for the matched people only; unmatched blocks are skipped, not guessed at. Status derives from the machine's own vocabulary, which across all 970 rows of the real samples is exhaustively empty / `Libur Rutin` / `Alpha`.

Verify against the spreadsheet's own numbers rather than trusting the summary:

```sql
select s.full_name, s.fingerprint_id, ar.date, ar.status, ar.check_in_time
from attendance_records ar join students s on s.id = ar.student_id
where ar.imported_by_user_id is not null
order by s.full_name, ar.date limit 30;

select t.full_name, tar.date, tar.status, tar.check_in_time
from teacher_attendance_records tar join teachers t on t.id = tar.teacher_id
order by t.full_name, tar.date limit 30;
```

Open the `.xlsx` and spot-check a few dates and check-in times against those rows.

**Two specific things to confirm:**

- **Re-import the same file.** `(teacher_id, date)` and the student equivalent are unique, so a second import must not duplicate rows.
- **Teacher-recorded attendance still works.** Log in as a teacher, take attendance for a class normally. `attendance_records.recorded_by_teacher_id` became nullable to accommodate imported rows, so the column is no longer a guarantee — confirm manual entries still populate it.

Uploads go browser → presigned URL → R2/MinIO directly, never through the app server. If an upload fails with no server-side error, suspect CORS on the bucket rather than the app.

---

## TSD-01 — Student registration

This has the most moving parts and the only bug found in the batch, so test the whole chain rather than just submission.

1. Log out. Open `http://localhost:3000/register` — it is public and unauthenticated by design.
2. Fill the form. Every field is mandatory at submit, matching the Dapodik F-PD form. Use the real sample as a reference for what the fields mean: `1.Formulir Peserta Didik AHMAD HAMMAM NAUFAL ZAIM ... .xls`. Watch for the field shapes that were corrected against that real file — one combined `fullName` (not split first/last), two separate phone fields, income as a categorical bracket rather than a number, and a separate special-needs field for each of father and mother.
3. Add at least one row to **achievements** and one to **non-formal education** — these are separate tables and are easy to miss.
4. Submit. Locally the Turnstile widget is the always-pass test key.
5. Log in as admin → **Pendaftaran**. The application shows as **Menunggu**.
6. **Setujui & Daftarkan**.

**Expected:** a real student record is created and the application flips to **Disetujui**, linked to the new student.

**This is the step that previously failed with a misleading "Gagal membuat data siswa".** The approval runs inside one outer transaction, and the student read-back used to run on a separate connection that could not see its own uncommitted insert, rolling the whole approval back even though the insert was fine. If that error reappears, the cause is a repository read not accepting the transaction handle — not bad input.

```sql
select a.full_name, a.status, a.promoted_student_id, s.id as student_id, s.full_name
from student_registration_applications a
left join students s on s.id = a.promoted_student_id
order by a.submitted_at desc limit 5;

select (select count(*) from student_registration_achievements) as achievements,
       (select count(*) from student_registration_nonformal_educations) as nonformal;
```

Then cover the remaining paths:

- **Reject** a second application with a reason. It becomes **Ditolak**, reason stored, no student created.
- **Approve as a teacher**, not an admin — `/teacher/registrations`. Any teacher can approve; this is intentionally not restricted to homeroom teachers.
- **Ekspor CSV** from the registrations page. Open the file and confirm the Dapodik columns are populated.

---

## TSD-03 — Bulk class promotion

Last, because it empties the roster it touches.

1. **Kelas** → row menu → **Promosikan**.
2. Pick the destination **Tahun ajaran tujuan** and default **Kelas tujuan**.
3. Override at least three students so all three outcomes are covered: default **Naik kelas**, one **Tinggal kelas** (with its own destination class), one **Keluar**.
4. Confirm.

**Expected:** promoted and repeated students get a new enrollment in the destination class and their `currentClassId` moves; withdrawn students get no new enrollment. The source class roster is then empty — it is fetched live by `currentClassId`, so the class cannot be promoted twice through the same entry point. That emptiness is the designed outcome, not a failure.

```sql
select s.full_name, e.status, c.name as class_name, ay.name as year
from enrollments e
join students s on s.id = e.student_id
join classes c on c.id = e.class_id
join academic_years ay on ay.id = c.academic_year_id
order by s.full_name, ay.name;

select full_name, current_class_id from students order by full_name;
```

No schema change backs this feature — it reuses the `promoted` / `repeated` / `withdrawn` values that already existed unused on `enrollments.status`.

---

## Pass B — Turnstile on production

The only test that must run against production, because the widget's site key is scoped to `app.ismadani.sch.id`.

1. Open `https://app.ismadani.sch.id/register` in a normal browser (not a headless or automated one — that is the point of the widget).
2. **Expected:** the Turnstile widget renders. If you instead see "Memuat verifikasi keamanan…" stuck indefinitely, the site key did not reach the client bundle.
3. Confirm it is the real widget, not the test one — in devtools, the rendered sitekey should be `0x4AAAAAAFK1TZ6JxTiDjtyW`. Anything starting `1x0000` means a test key shipped.
4. Open the same URL via `https://elearning.abd-majidehamide.workers.dev/register`. **Expected: verification fails.** The widget is scoped to the custom domain only — this failure is correct behaviour, not a defect.

**If you submit the form on production you will create a real pending application in the real database.** That is the only way to prove end-to-end verification, and it is recoverable — approve nothing, reject it, or delete the row:

```sh
set -a && . ./.env.production && set +a
PGCONNECT_TIMEOUT=20 psql "$DATABASE_URL" \
  -c "select id, full_name, status, submitted_at from student_registration_applications order by submitted_at desc limit 5;"
```

Delete the test row by id once satisfied. Decide before submitting whether you want that row to exist.

Note for any script that talks to production Postgres from Node or Bun: it will hang with `CONNECT_TIMEOUT` unless IPv4 is forced, because the IPv6 addresses are blackholed and Node's `autoSelectFamily` does not fall back. `psql` is unaffected. See RFC 0004's rollout log for the working invocation.

---

## What a clean pass looks like

- [ ] TSD-05 — half-day student gets only half-day + all-types fee lines; CSV import still works
- [ ] TSD-02 — Dapodik fields persist; `employeeNumber` → `username` sync intact and untouched by the Dapodik form
- [ ] TSD-04 — both sample files import, dates and times match the spreadsheet, re-import creates no duplicates, teacher-recorded attendance still sets `recorded_by_teacher_id`
- [ ] TSD-01 — approve creates a student with no "Gagal membuat data siswa"; reject stores a reason; teacher approval works; CSV export populated
- [ ] TSD-03 — all three outcomes correct; source roster empties
- [ ] Turnstile — real widget renders on the custom domain, fails on the workers.dev URL

Anything that fails here is worth capturing with the exact error text and the matching SQL output — the batch's one real bug surfaced as a misleading user-facing message with a perfectly healthy database underneath.
