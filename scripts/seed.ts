// One-time local-dev seed: a full demo-scale fictitious elementary school
// (SD) — org structure, accounts for every role, fee/invoice arrears,
// e-learning modules with assignments/quizzes, and attendance history.
// Run against a freshly-migrated database — see `bun run db:seed` / README
// "Local setup" and docs/rfc/0003-local-dev-seed-accounts.md.
//
// Not used in production (no seed step in the deploy path — see RFC 0001).

// Bun auto-loads .env.local / .env, so DATABASE_URL is already in
// process.env by the time this runs — see drizzle.config.ts for the
// equivalent explicit load drizzle-kit needs (it isn't run via `bun run`).

import { AuthService } from "@/server/services/auth-service";
import { AcademicService } from "@/server/services/academic-service";
import { TeacherService } from "@/server/services/teacher-service";
import { StudentService } from "@/server/services/student-service";
import { GuardianService } from "@/server/services/guardian-service";
import { FeeService } from "@/server/services/fee-service";
import { CourseService } from "@/server/services/course-service";
import { AssignmentService } from "@/server/services/assignment-service";
import { QuizService } from "@/server/services/quiz-service";
import { AttendanceService } from "@/server/services/attendance-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { UserRepository } from "@/server/repositories/user-repository";
import { hashPassword } from "@/lib/auth/password";
import type { Gender } from "@/lib/db/schema";

type Credential = { role: string; label: string; identifier: string; password: string };
const credentials: Credential[] = [];

// Every non-admin account gets this same fixed password (overwriting the
// random temp password `registerTeacher`/`grantPortalAccess` generate) —
// demo/local-dev only, so credentials stay reusable across re-seeds instead
// of changing every run. Still leaves `mustChangePassword: true` (see
// UserRepository.resetPassword), matching the real provisioning UX.
const FIXED_PASSWORD = "Demo#Madani2026";

async function setFixedPassword(userId: string) {
  await UserRepository.resetPassword(userId, await hashPassword(FIXED_PASSWORD));
}

// --- Name pools (students/guardians are generated, not hand-listed — see RFC 0003) ---
const MALE_FIRST_NAMES = ["Ahmad", "Rizky", "Fajar", "Dimas", "Bayu", "Arya", "Reza", "Fikri", "Yusuf", "Iqbal", "Zaki", "Rafi", "Fahri", "Farrel", "Galih"];
const FEMALE_FIRST_NAMES = ["Putri", "Dewi", "Nadia", "Salsabila", "Anisa", "Larasati", "Kirana", "Zahra", "Aulia", "Intan", "Citra", "Maya", "Ayu", "Bella", "Keisya"];
const STUDENT_LAST_NAMES = ["Fauzi", "Ramadhani", "Anggraini", "Pratama", "Kusuma", "Setiawan", "Wijaya", "Saputra", "Hidayat", "Permata", "Wardani", "Kurniawan", "Susanti", "Nugraha", "Handayani", "Firmansyah", "Lestari", "Gunawan", "Utami", "Yulianto"];
const GUARDIAN_FIRST_NAMES_M = ["Hendra", "Agus", "Wawan", "Bambang", "Joko", "Slamet", "Dedi", "Iwan", "Rudi", "Hadi"];
const GUARDIAN_FIRST_NAMES_F = ["Yuni", "Lina", "Sri", "Rina", "Tuti", "Wati", "Ani", "Endang", "Sari", "Dian"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

async function main() {
  if (await AuthService.adminExists()) {
    throw new Error("Admin already exists — refusing to reseed a non-empty database. Reset the db first.");
  }

  const admin = await AuthService.bootstrapAdmin("admin@sdmadani.sch.id", "Admin#Madani2026");
  credentials.push({ role: "admin", label: "Admin (Tata Usaha)", identifier: admin.email!, password: "Admin#Madani2026" });

  // --- Academic years: one past (history), one current (everything else attaches here) ---
  await AcademicService.createAcademicYear({ name: "2025/2026", startDate: "2025-07-14", endDate: "2026-06-19", isCurrent: false });
  const year = await AcademicService.createAcademicYear({ name: "2026/2027", startDate: "2026-07-13", endDate: "2027-06-19", isCurrent: true });

  // --- Subjects (Mata Pelajaran) ---
  const subjectDefs = [
    { name: "Matematika", code: "MTK" },
    { name: "Bahasa Indonesia", code: "BIN" },
    { name: "Ilmu Pengetahuan Alam", code: "IPA" },
    { name: "Ilmu Pengetahuan Sosial", code: "IPS" },
    { name: "Pendidikan Agama Islam", code: "PAI" },
    { name: "Seni Budaya", code: "SBD" },
    { name: "PJOK", code: "PJOK" },
  ];
  const subjects = await Promise.all(subjectDefs.map((s) => AcademicService.createSubject(s)));
  function subject(name: string) {
    const found = subjects.find((s) => s?.name === name);
    if (!found) throw new Error(`Subject "${name}" not seeded`);
    return found;
  }

  // --- Teachers: 6 homeroom (one per grade 1-6) + 2 specialists (PJOK, Seni Budaya) ---
  const teacherDefs = [
    { firstName: "Siti", lastName: "Nurhaliza", employeeNumber: "NIP-2026001", phone: "+6281234560001", role: "homeroom" as const, gradeLevel: 1 },
    { firstName: "Budi", lastName: "Santoso", employeeNumber: "NIP-2026002", phone: "+6281234560002", role: "homeroom" as const, gradeLevel: 2 },
    { firstName: "Rina", lastName: "Wijaya", employeeNumber: "NIP-2026003", phone: "+6281234560003", role: "homeroom" as const, gradeLevel: 3 },
    { firstName: "Hidayat", lastName: "Nugroho", employeeNumber: "NIP-2026004", phone: "+6281234560004", role: "homeroom" as const, gradeLevel: 4 },
    { firstName: "Wulandari", lastName: "Putri", employeeNumber: "NIP-2026005", phone: "+6281234560005", role: "homeroom" as const, gradeLevel: 5 },
    { firstName: "Eko", lastName: "Prasetyo", employeeNumber: "NIP-2026006", phone: "+6281234560006", role: "homeroom" as const, gradeLevel: 6 },
    { firstName: "Fitri", lastName: "Ramadhani", employeeNumber: "NIP-2026007", phone: "+6281234560007", role: "specialist" as const, subjectName: "PJOK" },
    { firstName: "Guntur", lastName: "Wibowo", employeeNumber: "NIP-2026008", phone: "+6281234560008", role: "specialist" as const, subjectName: "Seni Budaya" },
  ];

  const registeredTeachers = [];
  for (const t of teacherDefs) {
    const email = `${t.firstName.toLowerCase()}.${t.lastName.toLowerCase()}@sdmadani.sch.id`;
    const { user, teacher } = await TeacherService.registerTeacher({
      email,
      firstName: t.firstName,
      lastName: t.lastName,
      employeeNumber: t.employeeNumber,
      phone: t.phone,
      hireDate: "2026-07-01",
    });
    await setFixedPassword(user.id);
    registeredTeachers.push({ def: t, teacher, userId: user.id });
    credentials.push({
      role: "teacher",
      label: t.role === "homeroom" ? `Guru — Wali Kelas ${t.gradeLevel}` : `Guru — Spesialis ${t.subjectName}`,
      identifier: `${email} (NIP: ${t.employeeNumber})`,
      password: FIXED_PASSWORD,
    });
  }
  const homeroomTeachers = registeredTeachers.filter((t) => t.def.role === "homeroom");
  const specialistTeachers = registeredTeachers.filter((t) => t.def.role === "specialist");

  // --- Classes: Kelas 1A-6A, one per homeroom teacher ---
  const classDefs = homeroomTeachers.map((t) => ({ gradeLevel: t.def.gradeLevel!, teacher: t }));
  type RegisteredClass = { gradeLevel: number; cls: NonNullable<Awaited<ReturnType<typeof AcademicService.createClass>>>; homeroom: (typeof homeroomTeachers)[number] };
  const classes: RegisteredClass[] = [];
  for (const c of classDefs) {
    const cls = await AcademicService.createClass({
      name: `Kelas ${c.gradeLevel}`,
      section: "A",
      gradeLevel: c.gradeLevel,
      academicYearId: year.id,
      classTeacherId: c.teacher.teacher.id,
      capacity: 30,
    });
    classes.push({ gradeLevel: c.gradeLevel, cls, homeroom: c.teacher });

    // Homeroom teacher teaches the 5 core subjects in their own class.
    for (const name of ["Matematika", "Bahasa Indonesia", "Ilmu Pengetahuan Alam", "Ilmu Pengetahuan Sosial", "Pendidikan Agama Islam"]) {
      await AcademicService.assignTeacherToClassSubject({
        teacherId: c.teacher.teacher.id,
        classId: cls.id,
        subjectId: subject(name).id,
        academicYearId: year.id,
      });
    }
  }
  // Specialists teach their one subject across every class.
  for (const specialist of specialistTeachers) {
    for (const c of classes) {
      await AcademicService.assignTeacherToClassSubject({
        teacherId: specialist.teacher.id,
        classId: c.cls.id,
        subjectId: subject(specialist.def.subjectName!).id,
        academicYearId: year.id,
      });
    }
  }

  // --- Students + guardians: 5 per class, 30 total, generated from name pools ---
  type RegisteredStudent = {
    student: NonNullable<Awaited<ReturnType<typeof StudentService.registerStudent>>>;
    firstName: string;
    lastName: string;
    classInfo: (typeof classes)[number];
  };
  const registeredStudents: RegisteredStudent[] = [];

  let globalIndex = 0;
  for (const classInfo of classes) {
    for (let i = 0; i < 5; i++) {
      globalIndex++;
      const isMale = globalIndex % 2 === 0;
      const firstName = isMale
        ? MALE_FIRST_NAMES[globalIndex % MALE_FIRST_NAMES.length]
        : FEMALE_FIRST_NAMES[globalIndex % FEMALE_FIRST_NAMES.length];
      const lastName = STUDENT_LAST_NAMES[(globalIndex * 7) % STUDENT_LAST_NAMES.length];
      const gender: Gender = isMale ? "male" : "female";
      const birthYear = 2019 - (classInfo.gradeLevel - 1);
      const dob = `${birthYear}-${pad2((globalIndex % 12) + 1)}-${pad2((globalIndex % 28) + 1)}`;
      const admissionNumber = `2026-${String(globalIndex).padStart(4, "0")}`;

      const guardianIsFather = globalIndex % 2 === 0;
      const guardianFirstName = guardianIsFather
        ? GUARDIAN_FIRST_NAMES_M[globalIndex % GUARDIAN_FIRST_NAMES_M.length]
        : GUARDIAN_FIRST_NAMES_F[globalIndex % GUARDIAN_FIRST_NAMES_F.length];
      const guardianEmail = `${guardianFirstName.toLowerCase()}.${lastName.toLowerCase()}${globalIndex}@gmail.com`;

      const student = await StudentService.registerStudent({
        admissionNumber,
        firstName,
        lastName,
        dateOfBirth: dob,
        gender,
        classId: classInfo.cls.id,
        academicYearId: year.id,
        enrollmentDate: "2026-07-13",
        guardians: [
          {
            firstName: guardianFirstName,
            lastName,
            relationshipType: guardianIsFather ? "father" : "mother",
            phone: `+62813${String(2000000 + globalIndex).slice(-7)}`,
            email: guardianEmail,
            isPrimaryContact: true,
            isBillingContact: true,
          },
        ],
      });
      if (!student) throw new Error(`registerStudent returned no row for ${admissionNumber}`);
      registeredStudents.push({ student, firstName, lastName, classInfo });

      // Grade 3+ students get their own portal login; grade 1-2 kids don't
      // (RFC 0001). Exception: Kelas 1A's first student also gets one, so
      // there's a real young-kid account to demo the student portal with.
      const grantsStudentLogin = classInfo.gradeLevel >= 3 || (classInfo.gradeLevel === 1 && i === 0);
      if (grantsStudentLogin) {
        const { username } = await StudentService.grantPortalAccess(student.id);
        const studentUser = await UserRepository.findByUsername(username!);
        await setFixedPassword(studentUser!.id);
        credentials.push({
          role: "student",
          label: `Siswa — ${firstName} ${lastName} (Kelas ${classInfo.gradeLevel}A)`,
          identifier: username!,
          password: FIXED_PASSWORD,
        });
      }

      const [{ guardian }] = await StudentRepository.listGuardiansForStudent(student.id);
      await GuardianService.grantPortalAccess(guardian.id, guardianEmail);
      const guardianUser = await UserRepository.findByEmail(guardianEmail);
      await setFixedPassword(guardianUser!.id);
      credentials.push({
        role: "parent",
        label: `Wali — ${guardianFirstName} ${lastName} (ortu ${firstName})`,
        identifier: guardianEmail,
        password: FIXED_PASSWORD,
      });
    }
  }

  // --- Katalog Biaya (fee catalog) ---
  const feeCatalogDefs = [
    { name: "SPP Bulanan", amountRupiah: 150_000, frequency: "monthly" as const },
    { name: "Uang Gedung", amountRupiah: 1_500_000, frequency: "one_time" as const },
    { name: "Seragam Sekolah", amountRupiah: 350_000, frequency: "one_time" as const },
    { name: "Buku & Alat Tulis", amountRupiah: 250_000, frequency: "annual" as const },
    { name: "Kegiatan Ekstrakurikuler", amountRupiah: 75_000, frequency: "termly" as const },
    { name: "Study Tour Kelas 6", amountRupiah: 500_000, frequency: "one_time" as const, gradeLevel: 6 },
  ];
  // amountCents follows the same "amount (Rupiah) × 100" convention the admin UI uses
  // (see fee-controller.ts's createFeeStructureAction) — not literal cents.
  const feeCatalog = await Promise.all(
    feeCatalogDefs.map((f) =>
      FeeService.createFeeStructure({
        name: f.name,
        academicYearId: year.id,
        amountCents: f.amountRupiah * 100,
        frequency: f.frequency,
        gradeLevel: f.gradeLevel,
      })
    )
  );
  function fee(name: string) {
    const found = feeCatalog.find((f) => f?.name === name);
    if (!found) throw new Error(`Fee structure "${name}" not seeded`);
    return found;
  }
  function lineItem(name: string) {
    const f = fee(name);
    return { feeStructureId: f.id, description: f.name, amountCents: f.amountCents };
  }
  async function createInvoice(input: Parameters<typeof FeeService.generateInvoiceForStudent>[0]) {
    const invoice = await FeeService.generateInvoiceForStudent(input);
    if (!invoice) throw new Error("generateInvoiceForStudent returned no row");
    return invoice;
  }

  // Tagihan + Tunggakan: SPP for everyone, Uang Gedung for ~1/3, Ekstrakurikuler
  // for ~1/4 — invoice generation and payment recording stay strictly
  // sequential (both invoiceNumber/receiptNumber are Date.now()-derived, so
  // parallel calls risk colliding on the unique constraint).
  let invoiceIndex = 0;
  for (const [i, rs] of registeredStudents.entries()) {
    const sppInvoice = await createInvoice({
      studentId: rs.student.id,
      academicYearId: year.id,
      issueDate: "2026-07-13",
      dueDate: "2026-07-31",
      lineItems: [lineItem("SPP Bulanan")],
    });
    invoiceIndex++;
    await settleInvoice(sppInvoice.id, sppInvoice.totalAmountCents, invoiceIndex);

    if (i % 3 === 0) {
      const gedungInvoice = await createInvoice({
        studentId: rs.student.id,
        academicYearId: year.id,
        issueDate: "2026-07-13",
        dueDate: "2026-07-20",
        lineItems: [lineItem("Uang Gedung")],
      });
      invoiceIndex++;
      await settleInvoice(gedungInvoice.id, gedungInvoice.totalAmountCents, invoiceIndex);
    }

    if (i % 4 === 0) {
      const ekskulInvoice = await createInvoice({
        studentId: rs.student.id,
        academicYearId: year.id,
        issueDate: "2026-07-20",
        dueDate: "2026-08-15",
        lineItems: [lineItem("Kegiatan Ekstrakurikuler")],
      });
      invoiceIndex++;
      await settleInvoice(ekskulInvoice.id, ekskulInvoice.totalAmountCents, invoiceIndex);
    }
  }

  /** Rotates paid/partial/unpaid across invoices so `/admin/fees` shows a real spread, not one uniform state. */
  async function settleInvoice(invoiceId: string, totalAmountCents: number, index: number) {
    const state = index % 3;
    if (state === 0) return; // unpaid — arrears
    await FeeService.recordPayment({
      invoiceId,
      amountCents: state === 1 ? totalAmountCents : Math.floor(totalAmountCents / 2), // 1 = paid in full, 2 = partial
      method: index % 2 === 0 ? "bank_transfer" : "cash",
      paidAt: "2026-07-22",
      recordedByUserId: admin.id,
    });
  }

  // --- Modul (e-learning courses) + assignments + quizzes, per class ---
  const mathQuestions = [
    { questionText: "Berapakah hasil dari 12 + 8?", type: "multiple_choice" as const, points: 25, options: [{ text: "18", isCorrect: false }, { text: "20", isCorrect: true }, { text: "22", isCorrect: false }, { text: "24", isCorrect: false }] },
    { questionText: "Berapakah hasil dari 9 x 3?", type: "multiple_choice" as const, points: 25, options: [{ text: "27", isCorrect: true }, { text: "24", isCorrect: false }, { text: "18", isCorrect: false }, { text: "21", isCorrect: false }] },
    { questionText: "7 adalah bilangan ganjil.", type: "true_false" as const, points: 25, options: [{ text: "Benar", isCorrect: true }, { text: "Salah", isCorrect: false }] },
    { questionText: "Berapakah hasil dari 100 - 45?", type: "short_answer" as const, points: 25, correctAnswerText: "55" },
  ];
  const indoQuestions = [
    { questionText: "Kata dasar dari 'membaca' adalah...", type: "multiple_choice" as const, points: 25, options: [{ text: "baca", isCorrect: true }, { text: "baca-baca", isCorrect: false }, { text: "membaca", isCorrect: false }, { text: "dibaca", isCorrect: false }] },
    { questionText: "Kalimat tanya biasanya diakhiri dengan tanda...", type: "multiple_choice" as const, points: 25, options: [{ text: "titik", isCorrect: false }, { text: "tanya", isCorrect: true }, { text: "seru", isCorrect: false }, { text: "koma", isCorrect: false }] },
    { questionText: "'Buku' termasuk kata benda.", type: "true_false" as const, points: 25, options: [{ text: "Benar", isCorrect: true }, { text: "Salah", isCorrect: false }] },
    { questionText: "Sinonim dari kata 'senang' adalah...", type: "short_answer" as const, points: 25, correctAnswerText: "gembira" },
  ];

  async function seedClassContent(classInfo: (typeof classes)[number]) {
    const students = registeredStudents.filter((rs) => rs.classInfo.cls.id === classInfo.cls.id);
    const teacherUserId = classInfo.homeroom.userId;

    const courseDefs = [
      { subjectName: "Matematika", questions: mathQuestions, dueDate: "2026-07-20", allowLate: true },
      { subjectName: "Bahasa Indonesia", questions: indoQuestions, dueDate: "2026-08-20", allowLate: true },
    ];

    for (const cd of courseDefs) {
      const course = await CourseService.createCourse({
        teacherUserId,
        title: `${cd.subjectName} Kelas ${classInfo.gradeLevel}`,
        description: `Modul ${cd.subjectName} untuk Kelas ${classInfo.gradeLevel}A`,
        subjectId: subject(cd.subjectName).id,
        classId: classInfo.cls.id,
        academicYearId: year.id,
      });
      const bab2 = await CourseService.createTheme({ teacherUserId, courseId: course.id, title: "Bab 2" });
      const detail = await CourseService.courseDetail(course.id);
      const bab1 = detail!.themes.find((t) => t.title === "Bab 1")!;

      for (const theme of [bab1, bab2]) {
        await CourseService.addContentItem({
          teacherUserId,
          courseId: course.id,
          themeId: theme.id,
          title: `Ringkasan ${theme.title}`,
          type: "note",
          bodyMarkdown: `Catatan materi ${cd.subjectName} untuk ${theme.title}. Baca dan pahami sebelum mengerjakan tugas dan kuis.`,
        });
        await CourseService.addContentItem({
          teacherUserId,
          courseId: course.id,
          themeId: theme.id,
          title: "Latihan Mandiri",
          type: "note",
          bodyMarkdown: "Kerjakan latihan soal di buku tulis kalian, lalu diskusikan bersama teman sebangku.",
        });
      }
      await CourseService.publishCourse(teacherUserId, course.id);

      // Assignment — Matematika's is past-due (late submissions to grade), Bahasa Indonesia's is future-due (on-time, one still missing).
      const assignment = await AssignmentService.createAssignment({
        teacherUserId,
        courseId: course.id,
        themeId: bab1.id,
        title: `Tugas ${cd.subjectName} — Bab 1`,
        instructions: "Kerjakan sesuai materi Bab 1 dan kumpulkan tepat waktu.",
        dueDate: cd.dueDate,
        maxScore: 100,
        allowLateSubmission: cd.allowLate,
      });
      const submitters = cd.dueDate === "2026-08-20" ? students.slice(0, 4) : students; // leave one student "missing" on the future-due assignment
      const submissions = [];
      for (const s of submitters) {
        const submission = await AssignmentService.submit({
          assignmentId: assignment.id,
          studentId: s.student.id,
          textResponse: `Jawaban tugas oleh ${s.firstName} ${s.lastName}.`,
        });
        submissions.push(submission);
      }
      const toGrade = submissions.slice(0, Math.ceil(submissions.length * 0.75));
      for (const sub of toGrade) {
        const score = Math.round(65 + Math.random() * 35);
        await AssignmentService.gradeSubmission({
          teacherUserId,
          submissionId: sub.id,
          score,
          feedback: score >= 85 ? "Kerja bagus, pertahankan!" : "Sudah baik, terus berlatih ya.",
        });
      }

      // Quiz
      const quiz = await QuizService.createQuiz({
        teacherUserId,
        courseId: course.id,
        themeId: bab1.id,
        title: `Kuis ${cd.subjectName} — Bab 1`,
        instructions: "Jawab semua soal berikut.",
        timeLimitMinutes: 15,
        maxAttempts: 1,
      });
      for (const q of cd.questions) {
        await QuizService.addQuestion({ teacherUserId, quizId: quiz.id, ...q });
      }
      await QuizService.publishQuiz(teacherUserId, quiz.id);
      const quizDetail = await QuizService.quizDetail(quiz.id);

      for (const s of students) {
        const attempt = await QuizService.startAttempt(s.student.id, quiz.id);
        const answers = quizDetail!.questions.map(({ question, options }) => {
          const answeredCorrectly = Math.random() < 0.7;
          if (question.type === "short_answer") {
            return {
              questionId: question.id,
              shortAnswerText: answeredCorrectly ? question.correctAnswerText! : "tidak tahu",
            };
          }
          const correctOption = options.find((o) => o.isCorrect)!;
          const wrongOption = options.find((o) => !o.isCorrect) ?? correctOption;
          return { questionId: question.id, selectedOptionId: (answeredCorrectly ? correctOption : wrongOption).id };
        });
        await QuizService.submitAttempt(s.student.id, attempt.id, answers);
      }

      // Demo-only extras: Kelas 1A's Matematika course gets one more
      // assignment and quiz that nobody has touched — so there's always a
      // pending "belum dikumpulkan" assignment and a fresh, repeatable quiz
      // ready to demo live with the Kelas 1A student account granted above.
      if (classInfo.gradeLevel === 1 && cd.subjectName === "Matematika") {
        await AssignmentService.createAssignment({
          teacherUserId,
          courseId: course.id,
          themeId: bab1.id,
          title: "Tugas Latihan — Penjumlahan",
          instructions: "Kerjakan soal penjumlahan berikut di buku tulis kalian, lalu foto dan kumpulkan di sini.",
          dueDate: "2026-08-25",
          maxScore: 100,
          allowLateSubmission: true,
        });

        const demoQuiz = await QuizService.createQuiz({
          teacherUserId,
          courseId: course.id,
          themeId: bab1.id,
          title: "Kuis Latihan — Penjumlahan & Pengurangan",
          instructions: "Jawab semua soal berikut. Kamu bisa mengulang kuis ini hingga 10 kali.",
          timeLimitMinutes: 15,
          maxAttempts: 10,
        });
        await QuizService.addQuestion({
          teacherUserId,
          quizId: demoQuiz.id,
          questionText: "Berapakah hasil dari 5 + 3?",
          type: "multiple_choice",
          points: 25,
          options: [
            { text: "7", isCorrect: false },
            { text: "8", isCorrect: true },
            { text: "9", isCorrect: false },
            { text: "6", isCorrect: false },
          ],
        });
        await QuizService.addQuestion({
          teacherUserId,
          quizId: demoQuiz.id,
          questionText: "Berapakah hasil dari 10 - 4?",
          type: "multiple_choice",
          points: 25,
          options: [
            { text: "5", isCorrect: false },
            { text: "6", isCorrect: true },
            { text: "7", isCorrect: false },
            { text: "4", isCorrect: false },
          ],
        });
        await QuizService.addQuestion({
          teacherUserId,
          quizId: demoQuiz.id,
          questionText: "9 lebih besar dari 5.",
          type: "true_false",
          points: 25,
          options: [
            { text: "Benar", isCorrect: true },
            { text: "Salah", isCorrect: false },
          ],
        });
        await QuizService.addQuestion({
          teacherUserId,
          quizId: demoQuiz.id,
          questionText: "Berapakah hasil dari 2 + 2?",
          type: "short_answer",
          points: 25,
          correctAnswerText: "4",
        });
        await QuizService.publishQuiz(teacherUserId, demoQuiz.id);
      }
    }
  }
  // Classes are fully independent of each other — safe to run in parallel.
  await Promise.all(classes.map(seedClassContent));

  // --- Attendance: last 10 weekdays up to today, all classes, all students ---
  function lastWeekdays(count: number): string[] {
    const dates: string[] = [];
    const cursor = new Date();
    while (dates.length < count) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) dates.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() - 1);
    }
    return dates.reverse();
  }
  const attendanceDates = lastWeekdays(10);
  const ATTENDANCE_STATUS_CYCLE = ["present", "present", "present", "present", "present", "present", "late", "present", "absent", "present", "present", "excused"] as const;

  await Promise.all(
    classes.flatMap((classInfo) => {
      const students = registeredStudents.filter((rs) => rs.classInfo.cls.id === classInfo.cls.id);
      return attendanceDates.map((date, dateIndex) =>
        AttendanceService.saveRegister(
          classInfo.homeroom.userId,
          classInfo.cls.id,
          date,
          students.map((s, studentIndex) => ({
            studentId: s.student.id,
            status: ATTENDANCE_STATUS_CYCLE[(studentIndex + dateIndex) % ATTENDANCE_STATUS_CYCLE.length],
          }))
        )
      );
    })
  );

  console.log("\nSeed complete.\n");
  console.log(JSON.stringify(credentials, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
