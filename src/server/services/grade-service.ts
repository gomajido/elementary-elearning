import { AssignmentSubmissionRepository } from "@/server/repositories/assignment-repository";
import { QuizAttemptRepository } from "@/server/repositories/quiz-repository";
import { CourseRepository } from "@/server/repositories/course-repository";
import { StudentRepository } from "@/server/repositories/student-repository";
import { AcademicYearRepository, SubjectRepository, ClassRepository } from "@/server/repositories/academic-repository";

/**
 * No persisted `grades` table — computed at read time from
 * assignment_submissions + quiz_attempts, per RFC 0001 "Core DB Schema".
 */
export const GradeService = {
  async gradesForStudent(studentId: string) {
    const [submissionRows, attemptRows] = await Promise.all([
      AssignmentSubmissionRepository.listForStudentWithDetails(studentId),
      QuizAttemptRepository.listForStudentWithDetails(studentId),
    ]);

    const assignments = submissionRows.map((row) => ({
      courseTitle: row.courseTitle,
      title: row.assignment.title,
      score: row.submission.score,
      maxScore: row.assignment.maxScore,
      status: row.submission.status,
    }));

    const quizzes = attemptRows
      .filter((row) => row.attempt.status === "auto_graded")
      .map((row) => ({
        courseTitle: row.courseTitle,
        title: row.quiz.title,
        score: row.attempt.totalScore,
        maxScore: row.attempt.maxPossibleScore,
      }));

    return { assignments, quizzes };
  },

  /** Per-student total assignment/quiz score for every student in a course's class. */
  async gradebookForCourse(courseId: string) {
    const course = await CourseRepository.findById(courseId);
    if (!course?.classId) return [];

    const [classStudents, submissionRows, attemptRows] = await Promise.all([
      StudentRepository.listByClass(course.classId),
      AssignmentSubmissionRepository.listSubmissionsForCourse(courseId),
      QuizAttemptRepository.listGradedForCourse(courseId),
    ]);

    return classStudents.map((student) => {
      const submissions = submissionRows.filter((r) => r.student.id === student.id && r.submission.score !== null);
      const attempts = attemptRows.filter((r) => r.student.id === student.id);

      const assignmentTotal = submissions.reduce((sum, r) => sum + (r.submission.score ?? 0), 0);
      const assignmentMax = submissions.reduce((sum, r) => sum + r.assignment.maxScore, 0);
      const quizTotal = attempts.reduce((sum, r) => sum + (r.attempt.totalScore ?? 0), 0);
      const quizMax = attempts.reduce((sum, r) => sum + r.attempt.maxPossibleScore, 0);

      return {
        student,
        assignmentTotal,
        assignmentMax,
        quizTotal,
        quizMax,
      };
    });
  },

  /** Per-subject averages for a student, scoped to the current academic year. */
  async reportCardForStudent(studentId: string) {
    const [student, academicYears, subjects] = await Promise.all([
      StudentRepository.findById(studentId),
      AcademicYearRepository.list(),
      SubjectRepository.list(),
    ]);
    const academicYear = academicYears.find((y) => y.isCurrent) ?? null;
    const classRow = student?.currentClassId ? await ClassRepository.findById(student.currentClassId) : null;

    if (!student || !academicYear) {
      return { student, classRow, academicYear, subjects: [] };
    }

    const [submissionRows, attemptRows] = await Promise.all([
      AssignmentSubmissionRepository.listForStudentWithDetails(studentId),
      QuizAttemptRepository.listForStudentWithDetails(studentId),
    ]);

    const gradedSubmissions = submissionRows.filter(
      (row) => row.academicYearId === academicYear.id && row.submission.score !== null,
    );
    const gradedAttempts = attemptRows.filter(
      (row) => row.academicYearId === academicYear.id && row.attempt.status === "auto_graded",
    );

    const subjectIds = new Set([...gradedSubmissions.map((r) => r.subjectId), ...gradedAttempts.map((r) => r.subjectId)]);

    const subjectReport = [...subjectIds].map((subjectId) => {
      const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? "Lainnya";

      const submissions = gradedSubmissions.filter((r) => r.subjectId === subjectId);
      const assignmentTotal = submissions.reduce((sum, r) => sum + (r.submission.score ?? 0), 0);
      const assignmentMax = submissions.reduce((sum, r) => sum + r.assignment.maxScore, 0);

      const attempts = gradedAttempts.filter((r) => r.subjectId === subjectId);
      const quizTotal = attempts.reduce((sum, r) => sum + (r.attempt.totalScore ?? 0), 0);
      const quizMax = attempts.reduce((sum, r) => sum + r.attempt.maxPossibleScore, 0);

      return {
        subjectId,
        subjectName,
        assignmentAvgPct: assignmentMax > 0 ? (assignmentTotal / assignmentMax) * 100 : null,
        quizAvgPct: quizMax > 0 ? (quizTotal / quizMax) * 100 : null,
        overallAvgPct: assignmentMax + quizMax > 0 ? ((assignmentTotal + quizTotal) / (assignmentMax + quizMax)) * 100 : null,
      };
    });

    subjectReport.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    return { student, classRow, academicYear, subjects: subjectReport };
  },
};
