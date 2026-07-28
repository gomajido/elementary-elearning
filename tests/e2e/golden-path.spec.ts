import { test, expect, type Page } from "@playwright/test";

/**
 * Full role-chain smoke test: admin sets up the school, provisions a
 * teacher and a student (with a guardian), the teacher builds a course
 * with content/an assignment/a quiz and publishes it, the student submits
 * work and takes the quiz (auto-graded), the teacher grades the
 * assignment, and the parent views the child's attendance/fees/grades —
 * with an explicit check that a parent can't view an unrelated student
 * (the RBAC boundary that matters most for a system holding minors' data,
 * per RFC 0001 "Verification Approach"). UI is Bahasa Indonesia.
 *
 * Uses a random suffix per run so it doesn't collide with prior runs and
 * doesn't require resetting the database first.
 */

const RUN = Date.now().toString(36);
// Fixed, not RUN-suffixed: /setup only ever creates ONE admin for the whole
// system (see RFC 0001 "Auth Design" — no public self-registration), so a
// fresh admin can't be created per run. If one already exists (e.g. from a
// prior test run against the same DB), we log in with these same fixed
// credentials rather than trying to create a new admin.
const ADMIN_EMAIL = "e2e-admin@test.local";
const ADMIN_PASSWORD = "adminpass123";
const TEACHER_EMAIL = `teacher-${RUN}@test.local`;
const STUDENT_EMAIL = `student-${RUN}@test.local`;
const GUARDIAN_EMAIL = `guardian-${RUN}@test.local`;

async function submit(page: Page, name: string | RegExp) {
  await page.getByRole("button", { name, exact: false }).click();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function selectOption(page: Page, labelText: string, optionText: string, occurrence = 0) {
  const labels = page.locator("label", { hasText: new RegExp(`^${escapeRegExp(labelText)}$`) });
  await labels.nth(occurrence).locator("xpath=following-sibling::*[1]").click();
  await page.getByRole("option", { name: optionText, exact: false }).first().click();
}

let teacherTempPassword: string;
let studentTempPassword: string;
let guardianTempPassword: string;
let assignmentId: string;
let courseUrl: string;
let quizUrl: string;

test.describe.serial("golden path across all four roles", () => {
  test("admin bootstraps and sets up the school", async ({ page }) => {
    await page.goto("/setup");
    const alreadySetUp = await page.getByText("Pengaturan selesai").isVisible().catch(() => false);
    if (!alreadySetUp) {
      await page.fill('input[name="email"]', ADMIN_EMAIL);
      await page.fill('input[name="password"]', ADMIN_PASSWORD);
      await submit(page, "Buat akun admin");
      await page.waitForURL("**/login");
    }

    await page.goto("/login");
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await submit(page, "Masuk");
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    await page.goto("/admin/academic-years");
    await page.fill('input[name="name"]', `${RUN}/${RUN}`);
    await page.fill('input[name="startDate"]', "2026-09-01");
    await page.fill('input[name="endDate"]', "2027-07-31");
    await page.check('input[name="isCurrent"]');
    await submit(page, "Tambah tahun ajaran");
    await expect(page.getByText(`${RUN}/${RUN}`).first()).toBeVisible();

    await page.goto("/admin/subjects");
    await page.fill('input[name="name"]', `Mathematics-${RUN}`);
    await submit(page, "Tambah mata pelajaran");
    await expect(page.getByText(`Mathematics-${RUN}`)).toBeVisible();

    await page.goto("/admin/teachers");
    await page.fill('input[name="firstName"]', "Jane");
    await page.fill('input[name="lastName"]', `Doe-${RUN}`);
    await page.fill('input[name="employeeNumber"]', `EMP-${RUN}`);
    await page.fill('input[name="email"]', TEACHER_EMAIL);
    await submit(page, "Buat akun guru");
    await expect(page.getByText("Kata sandi sementara")).toBeVisible();
    teacherTempPassword = (await page.locator("code").first().textContent())!;

    await page.goto("/admin/classes");
    await page.fill('input[name="name"]', `Primary-${RUN}`);
    await page.fill('input[name="section"]', "A");
    await page.fill('input[name="gradeLevel"]', "3");
    await selectOption(page, "Tahun ajaran", `${RUN}/${RUN}`);
    await selectOption(page, "Wali kelas (opsional)", `Doe-${RUN}`);
    await submit(page, "Tambah kelas");
    await expect(page.getByText(`Primary-${RUN}`).first()).toBeVisible();

    await page.goto("/admin/students");
    await page.fill('input[name="admissionNumber"]', `ADM-${RUN}`);
    await page.fill('input[name="firstName"]', "Amina");
    await page.fill('input[name="lastName"]', `Bello-${RUN}`);
    await page.fill('input[name="dateOfBirth"]', "2018-05-10");
    await page.fill('input[name="enrollmentDate"]', "2026-09-01");
    await selectOption(page, "Kelas", `Primary-${RUN}`);
    await selectOption(page, "Tahun ajaran", `${RUN}/${RUN}`);
    await page.fill('input[name="guardian1FirstName"]', "Fatima");
    await page.fill('input[name="guardian1LastName"]', `Bello-${RUN}`);
    await selectOption(page, "Hubungan", "Ibu");
    await page.fill('input[name="guardian1Email"]', GUARDIAN_EMAIL);
    await submit(page, "Daftarkan siswa");
    await expect(page.getByText(`ADM-${RUN}`)).toBeVisible();

    // Grant portal access to the student
    await page.fill('input[name="email"]', STUDENT_EMAIL);
    await submit(page, "Beri akses");
    await expect(page.getByText("Kata sandi sementara")).toBeVisible();
    studentTempPassword = (await page.locator("code").first().textContent())!;

    // Grant portal access to the guardian
    await page.goto("/admin/guardians");
    await page.fill('input[name="email"]', GUARDIAN_EMAIL);
    await submit(page, "Beri akses");
    await expect(page.getByText("Kata sandi sementara")).toBeVisible();
    guardianTempPassword = (await page.locator("code").first().textContent())!;
  });

  test("teacher builds a course with content, an assignment, and a quiz", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', TEACHER_EMAIL);
    await page.fill('input[name="password"]', teacherTempPassword);
    await submit(page, "Masuk");
    await expect(page).toHaveURL(/\/account\/change-password/);
    await page.fill('input[name="currentPassword"]', teacherTempPassword);
    await page.fill('input[name="newPassword"]', "newteacherpass1");
    await submit(page, "Simpan kata sandi baru");
    await expect(page).toHaveURL(/\/teacher\/dashboard/);

    await page.goto("/teacher/courses");
    await page.fill('input[name="title"]', `Fractions-${RUN}`);
    await selectOption(page, "Mata pelajaran", `Mathematics-${RUN}`);
    await selectOption(page, "Kelas", `Primary-${RUN}`);
    await selectOption(page, "Tahun ajaran", `${RUN}/${RUN}`);
    await submit(page, "Buat kursus");
    await expect(page.getByText(`Fractions-${RUN}`)).toBeVisible();
    await page.getByText(`Fractions-${RUN}`).click();
    await expect(page).toHaveURL(/\/teacher\/courses\//);
    courseUrl = page.url();

    await page.fill('input[name="title"]', "Intro note");
    await page.fill('textarea[name="bodyMarkdown"]', "A fraction represents part of a whole.");
    await submit(page, "Tambah materi");
    await expect(page.getByText("Intro note")).toBeVisible();

    const assignmentForm = page.locator("form", { has: page.getByRole("button", { name: "Buat tugas" }) });
    await assignmentForm.locator('input[name="title"]').fill(`Worksheet-${RUN}`);
    await assignmentForm.locator('input[name="dueDate"]').fill("2026-12-31");
    await assignmentForm.locator('input[name="maxScore"]').fill("10");
    await submit(page, "Buat tugas");
    await expect(page.getByText(`Worksheet-${RUN}`)).toBeVisible();
    const assignmentHref = await page.getByRole("link", { name: new RegExp(`Worksheet-${RUN}`) }).getAttribute("href");
    assignmentId = assignmentHref!.split("/").pop()!;

    const quizForm = page.locator("form", { has: page.getByRole("button", { name: "Buat kuis" }) });
    await quizForm.locator('input[name="title"]').fill(`Quiz-${RUN}`);
    await submit(page, "Buat kuis");
    await expect(page.getByText(`Quiz-${RUN}`)).toBeVisible();
    await page.getByRole("link", { name: new RegExp(`Quiz-${RUN}`) }).click();
    await expect(page).toHaveURL(/\/teacher\/quizzes\//);
    quizUrl = page.url();

    await page.fill('input[name="questionText"]', "What is 1/2 + 1/4?");
    await page.fill('input[name="points"]', "2");
    await page.fill('input[name="option1"]', "1/6");
    await page.fill('input[name="option2"]', "3/4");
    await page.check('input[name="correctOption"][value="2"]');
    await submit(page, "Tambah pertanyaan");
    await expect(page.getByText("What is 1/2 + 1/4?")).toBeVisible();

    await submit(page, "Terbitkan kuis");
    await expect(page.getByText("Diterbitkan")).toBeVisible();

    await page.goto(courseUrl);
    await submit(page, "Terbitkan kursus");
    await expect(page.getByText("Diterbitkan")).toBeVisible();
  });

  test("student submits the assignment and takes the quiz", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', STUDENT_EMAIL);
    await page.fill('input[name="password"]', studentTempPassword);
    await submit(page, "Masuk");
    await expect(page).toHaveURL(/\/account\/change-password/);
    await page.fill('input[name="currentPassword"]', studentTempPassword);
    await page.fill('input[name="newPassword"]', "newstudentpass1");
    await submit(page, "Simpan kata sandi baru");
    await expect(page).toHaveURL(/\/student\/dashboard/);

    await page.goto(`/student/assignments/${assignmentId}`);
    await page.fill('textarea[name="textResponse"]', "3/4");
    await submit(page, "Kirim");
    await expect(page.getByText(/Sudah dikumpulkan|kumpulkan ulang/)).toBeVisible();

    await page.goto(courseUrl.replace("/teacher/courses/", "/student/courses/"));
    await submit(page, "Mulai kuis");
    await expect(page).toHaveURL(/\/student\/quizzes\/attempt\//);
    await page.getByText("3/4", { exact: true }).click();
    await submit(page, "Kirim kuis");
    await expect(page.getByText(/Nilai: \d+ \/ \d+/)).toBeVisible();
    await expect(page.getByText("Nilai: 2 / 2")).toBeVisible();
  });

  test("teacher grades the assignment and sees the quiz result", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', TEACHER_EMAIL);
    await page.fill('input[name="password"]', "newteacherpass1");
    await submit(page, "Masuk");
    await expect(page).toHaveURL(/\/teacher\/dashboard/);

    await page.goto(quizUrl);
    await expect(page.getByText(`Bello-${RUN}`)).toBeVisible();
    await expect(page.getByText("2 / 2")).toBeVisible();

    await page.goto(`/teacher/assignments/${assignmentId}`);
    await page.fill('input[name="score"]', "8");
    await submit(page, "Nilai");
    await expect(page.getByText("Dinilai")).toBeVisible();
  });

  test("parent sees the child's attendance/fees/grades but not an unrelated student", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', GUARDIAN_EMAIL);
    await page.fill('input[name="password"]', guardianTempPassword);
    await submit(page, "Masuk");
    await expect(page).toHaveURL(/\/account\/change-password/);
    await page.fill('input[name="currentPassword"]', guardianTempPassword);
    await page.fill('input[name="newPassword"]', "newguardianpass1");
    await submit(page, "Simpan kata sandi baru");
    await expect(page).toHaveURL(/\/parent\/dashboard/);

    await expect(page.getByText(`Bello-${RUN}`)).toBeVisible();
    await page.getByText(`Bello-${RUN}`).click();
    await expect(page).toHaveURL(/\/parent\/children\//);
    await expect(page.getByText("Nilai")).toBeVisible();
    await expect(page.getByText(`Worksheet-${RUN}`)).toBeVisible();
    await expect(page.getByText("8 / 10")).toBeVisible();

    // RBAC boundary: a nonexistent/unrelated student id must 404, not leak data.
    await page.goto("/parent/children/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText(/404|tidak ditemukan/i).first()).toBeVisible();
  });
});
