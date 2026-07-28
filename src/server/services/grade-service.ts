import { AssignmentSubmissionRepository } from "@/server/repositories/assignment-repository";
import { QuizAttemptRepository } from "@/server/repositories/quiz-repository";
import { CourseRepository } from "@/server/repositories/course-repository";
import { StudentRepository } from "@/server/repositories/student-repository";

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
};
