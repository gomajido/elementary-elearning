import { cached } from "@/lib/cache/redis";
import { AttendanceRepository } from "@/server/repositories/attendance-repository";
import { AssignmentSubmissionRepository } from "@/server/repositories/assignment-repository";
import { QuizAttemptRepository } from "@/server/repositories/quiz-repository";
import { StudentRepository, EnrollmentRepository } from "@/server/repositories/student-repository";
import { ClassRepository, SubjectRepository, AcademicYearRepository } from "@/server/repositories/academic-repository";
import { FeeService } from "@/server/services/fee-service";

const CACHE_TTL_SECONDS = 15 * 60;

function pct(numerator: number, denominator: number) {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

async function computeAttendanceSummary() {
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endDate = now.toISOString().slice(0, 10);

  const [records, classRows] = await Promise.all([AttendanceRepository.listAll(startDate, endDate), ClassRepository.list()]);

  const byClass = new Map<string, { present: number; absent: number; late: number; excused: number; total: number }>();
  for (const record of records) {
    const entry = byClass.get(record.classId) ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    entry.total += 1;
    if (record.status === "present") entry.present += 1;
    else if (record.status === "absent") entry.absent += 1;
    else if (record.status === "late") entry.late += 1;
    else entry.excused += 1;
    byClass.set(record.classId, entry);
  }

  const perClass = [...byClass.entries()]
    .map(([classId, counts]) => {
      const classRow = classRows.find((c) => c.id === classId);
      return {
        classId,
        className: classRow ? `${classRow.name}${classRow.section ? ` ${classRow.section}` : ""}` : "—",
        ...counts,
        rate: pct(counts.present, counts.total),
      };
    })
    .sort((a, b) => a.className.localeCompare(b.className));

  const schoolTotals = perClass.reduce(
    (sum, c) => ({ present: sum.present + c.present, total: sum.total + c.total }),
    { present: 0, total: 0 },
  );

  return { schoolWideRate: pct(schoolTotals.present, schoolTotals.total), perClass };
}

async function computeFeeSummary() {
  const all = await FeeService.allInvoicesWithSummary();
  const totalBilledCents = all.reduce((sum, r) => sum + r.invoice.totalAmountCents, 0);
  const totalCollectedCents = all.reduce((sum, r) => sum + r.paidCents, 0);
  const totalOutstandingCents = all.reduce((sum, r) => sum + Math.max(r.balanceCents, 0), 0);

  return {
    totalBilledCents,
    totalCollectedCents,
    totalOutstandingCents,
    collectionRate: pct(totalCollectedCents, totalBilledCents),
  };
}

async function computeGradeSummary() {
  const [submissions, attempts, subjects] = await Promise.all([
    AssignmentSubmissionRepository.listAllGradedWithSubject(),
    QuizAttemptRepository.listAllGradedWithSubject(),
    SubjectRepository.list(),
  ]);

  const bySubject = new Map<string, { total: number; max: number }>();
  for (const s of submissions) {
    const entry = bySubject.get(s.subjectId) ?? { total: 0, max: 0 };
    entry.total += s.score ?? 0;
    entry.max += s.maxScore;
    bySubject.set(s.subjectId, entry);
  }
  for (const a of attempts) {
    const entry = bySubject.get(a.subjectId) ?? { total: 0, max: 0 };
    entry.total += a.totalScore ?? 0;
    entry.max += a.maxPossibleScore;
    bySubject.set(a.subjectId, entry);
  }

  const perSubject = [...bySubject.entries()]
    .map(([subjectId, { total, max }]) => ({
      subjectId,
      subjectName: subjects.find((s) => s.id === subjectId)?.name ?? "Lainnya",
      averagePct: pct(total, max),
    }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  const overallTotals = [...bySubject.values()].reduce(
    (sum, v) => ({ total: sum.total + v.total, max: sum.max + v.max }),
    { total: 0, max: 0 },
  );

  return { schoolWideAveragePct: pct(overallTotals.total, overallTotals.max), perSubject };
}

async function computeEnrollmentSummary() {
  const [allStudents, classRows, enrollmentRows, academicYears] = await Promise.all([
    StudentRepository.list(),
    ClassRepository.list(),
    EnrollmentRepository.listAll(),
    AcademicYearRepository.list(),
  ]);

  const activeStudents = allStudents.filter((s) => s.enrollmentStatus === "active");

  const countByClass = new Map<string, number>();
  for (const s of activeStudents) {
    if (!s.currentClassId) continue;
    countByClass.set(s.currentClassId, (countByClass.get(s.currentClassId) ?? 0) + 1);
  }
  const perClass = [...countByClass.entries()]
    .map(([classId, count]) => {
      const classRow = classRows.find((c) => c.id === classId);
      return { classId, className: classRow ? `${classRow.name}${classRow.section ? ` ${classRow.section}` : ""}` : "—", count };
    })
    .sort((a, b) => a.className.localeCompare(b.className));

  const studentIdsByYear = new Map<string, Set<string>>();
  for (const e of enrollmentRows) {
    const set = studentIdsByYear.get(e.academicYearId) ?? new Set<string>();
    set.add(e.studentId);
    studentIdsByYear.set(e.academicYearId, set);
  }
  const perYear = [...studentIdsByYear.entries()]
    .map(([academicYearId, studentIds]) => ({
      academicYearId,
      academicYearName: academicYears.find((y) => y.id === academicYearId)?.name ?? "—",
      count: studentIds.size,
    }))
    .sort((a, b) => a.academicYearName.localeCompare(b.academicYearName));

  return { totalActive: activeStudents.length, perClass, perYear };
}

export const AnalyticsService = {
  attendanceSummary: () => cached("analytics:attendance", CACHE_TTL_SECONDS, computeAttendanceSummary),
  feeSummary: () => cached("analytics:fees", CACHE_TTL_SECONDS, computeFeeSummary),
  gradeSummary: () => cached("analytics:grades", CACHE_TTL_SECONDS, computeGradeSummary),
  enrollmentSummary: () => cached("analytics:enrollment", CACHE_TTL_SECONDS, computeEnrollmentSummary),
};
