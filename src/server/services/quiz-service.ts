import {
  QuizRepository,
  QuizQuestionRepository,
  QuizAttemptRepository,
  QuizAnswerRepository,
} from "@/server/repositories/quiz-repository";
import { CourseRepository } from "@/server/repositories/course-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";
import type { QuestionType } from "@/lib/db/schema";

export class QuizError extends Error {}

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Slack on the server-side deadline, to absorb the round-trip of the client's
 * auto-submit plus modest clock drift. Short enough not to be usable as extra
 * working time on a realistically-sized quiz.
 */
export const SUBMIT_GRACE_MS = 60_000;

/** When an attempt must be in by, or null when the quiz is untimed. */
export function attemptDeadline(startedAt: Date, timeLimitMinutes: number | null): Date | null {
  if (!timeLimitMinutes) return null;
  return new Date(startedAt.getTime() + timeLimitMinutes * 60_000);
}

/** Past the deadline plus grace, a submission can't be trusted — the clock was stopped, not the work. */
export function isPastGrace(startedAt: Date, timeLimitMinutes: number | null, now: Date): boolean {
  const deadline = attemptDeadline(startedAt, timeLimitMinutes);
  if (!deadline) return false;
  return now.getTime() > deadline.getTime() + SUBMIT_GRACE_MS;
}

export const QuizService = {
  listForCourse: (courseId: string) => QuizRepository.listByCourse(courseId),

  async createQuiz(input: {
    teacherUserId: string;
    courseId: string;
    themeId: string;
    title: string;
    instructions?: string;
    timeLimitMinutes?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
  }) {
    const teacher = await TeacherRepository.findByUserId(input.teacherUserId);
    const course = await CourseRepository.findById(input.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new QuizError("Anda bukan pemilik modul ini");

    return QuizRepository.create({
      courseId: input.courseId,
      themeId: input.themeId,
      title: input.title,
      instructions: input.instructions,
      timeLimitMinutes: input.timeLimitMinutes,
      maxAttempts: input.maxAttempts,
      shuffleQuestions: input.shuffleQuestions,
    });
  },

  /** Resolves a quiz and checks the caller owns its course. */
  async assertTeacherOwnsQuiz(teacherUserId: string, quizId: string) {
    const quiz = await QuizRepository.findById(quizId);
    if (!quiz) throw new QuizError("Kuis tidak ditemukan");
    const teacher = await TeacherRepository.findByUserId(teacherUserId);
    const course = await CourseRepository.findById(quiz.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new QuizError("Anda bukan pemilik kuis ini");
    return quiz;
  },

  async updateQuiz(input: {
    teacherUserId: string;
    quizId: string;
    title: string;
    instructions?: string;
    timeLimitMinutes?: number;
    maxAttempts: number;
  }) {
    const quiz = await QuizService.assertTeacherOwnsQuiz(input.teacherUserId, input.quizId);
    await QuizRepository.update(quiz.id, {
      title: input.title,
      instructions: input.instructions,
      timeLimitMinutes: input.timeLimitMinutes ?? null,
      maxAttempts: input.maxAttempts,
    });
    return quiz;
  },

  /** Refuses once anyone has attempted it — even an in-progress attempt is a student's work. */
  async deleteQuiz(input: { teacherUserId: string; quizId: string }) {
    const quiz = await QuizService.assertTeacherOwnsQuiz(input.teacherUserId, input.quizId);
    const attempts = await QuizRepository.countAttempts(quiz.id);
    if (attempts > 0) {
      throw new QuizError(`Kuis ini sudah dikerjakan ${attempts} kali, jadi tidak bisa dihapus. Nilainya akan hilang.`);
    }
    await QuizRepository.softDelete(quiz.id);
    return quiz;
  },

  async quizDetail(quizId: string) {
    const quiz = await QuizRepository.findById(quizId);
    if (!quiz) return null;
    const questions = await QuizQuestionRepository.listWithOptionsByQuiz(quizId);
    return { quiz, questions };
  },

  async addQuestion(input: {
    teacherUserId: string;
    quizId: string;
    questionText: string;
    type: QuestionType;
    points: number;
    correctAnswerText?: string;
    options?: { text: string; isCorrect: boolean }[];
  }) {
    const teacher = await TeacherRepository.findByUserId(input.teacherUserId);
    const quiz = await QuizRepository.findById(input.quizId);
    if (!quiz) throw new QuizError("Kuis tidak ditemukan");
    const course = await CourseRepository.findById(quiz.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new QuizError("Anda bukan pemilik kuis ini");

    if (input.type !== "short_answer" && (!input.options || input.options.every((o) => !o.isCorrect))) {
      throw new QuizError("Tandai tepat satu pilihan sebagai benar");
    }
    if (input.type === "short_answer" && !input.correctAnswerText) {
      throw new QuizError("Soal isian singkat memerlukan jawaban yang benar");
    }

    const existing = await QuizQuestionRepository.listWithOptionsByQuiz(input.quizId);
    const question = await QuizQuestionRepository.create({
      quizId: input.quizId,
      orderIndex: existing.length,
      questionText: input.questionText,
      type: input.type,
      points: input.points,
      correctAnswerText: input.correctAnswerText,
    });

    if (input.options) {
      for (const [i, opt] of input.options.entries()) {
        await QuizQuestionRepository.createOption({
          questionId: question.id,
          optionText: opt.text,
          isCorrect: opt.isCorrect,
          orderIndex: i,
        });
      }
    }

    return question;
  },

  async publishQuiz(teacherUserId: string, quizId: string) {
    const teacher = await TeacherRepository.findByUserId(teacherUserId);
    const quiz = await QuizRepository.findById(quizId);
    if (!quiz) throw new QuizError("Kuis tidak ditemukan");
    const course = await CourseRepository.findById(quiz.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new QuizError("Anda bukan pemilik kuis ini");
    await QuizRepository.publish(quizId);
  },

  async startAttempt(studentId: string, quizId: string) {
    const quiz = await QuizRepository.findById(quizId);
    if (!quiz || !quiz.isPublished) throw new QuizError("Kuis tidak tersedia");

    const attemptCount = await QuizAttemptRepository.countForStudent(quizId, studentId);
    if (attemptCount >= quiz.maxAttempts) throw new QuizError("Tidak ada kesempatan tersisa");

    const questions = await QuizQuestionRepository.listWithOptionsByQuiz(quizId);
    const maxPossibleScore = questions.reduce((sum, q) => sum + q.question.points, 0);

    return QuizAttemptRepository.create({
      quizId,
      studentId,
      attemptNumber: attemptCount + 1,
      maxPossibleScore,
    });
  },

  async attemptDetail(attemptId: string) {
    const attempt = await QuizAttemptRepository.findById(attemptId);
    if (!attempt) return null;
    const quiz = await QuizRepository.findById(attempt.quizId);
    const questions = await QuizQuestionRepository.listWithOptionsByQuiz(attempt.quizId);
    const answers = await QuizAnswerRepository.listByAttempt(attemptId);
    // Absolute deadline rather than seconds-remaining: the client can then
    // survive a reload without gaining time.
    const deadline = attemptDeadline(attempt.startedAt, quiz?.timeLimitMinutes ?? null);
    return { attempt, quiz, questions, answers, deadline };
  },

  /**
   * Auto-grades on submit: multiple_choice/true_false score instantly by
   * comparing the selected option's `isCorrect`; short_answer uses a
   * normalized (trim + lowercase + collapse whitespace) exact match — see
   * RFC 0001 "Core DB Schema" quiz_questions notes.
   */
  async submitAttempt(
    studentId: string,
    attemptId: string,
    answers: { questionId: string; selectedOptionId?: string; shortAnswerText?: string }[]
  ) {
    const attempt = await QuizAttemptRepository.findById(attemptId);
    if (!attempt || attempt.studentId !== studentId) throw new QuizError("Percobaan tidak ditemukan");
    if (attempt.status !== "in_progress") throw new QuizError("Percobaan sudah dikumpulkan");

    // Checked against startedAt, not a client-supplied clock: pausing the tab
    // or reloading doesn't buy time. The countdown auto-submits at zero, so an
    // honest attempt lands well inside the grace window.
    const quiz = await QuizRepository.findById(attempt.quizId);
    if (isPastGrace(attempt.startedAt, quiz?.timeLimitMinutes ?? null, new Date())) {
      await QuizAttemptRepository.markGraded(attemptId, 0);
      throw new QuizError("Waktu habis — kuis ditutup dan tidak bisa dikumpulkan lagi.");
    }

    const questions = await QuizQuestionRepository.listWithOptionsByQuiz(attempt.quizId);
    let totalScore = 0;

    for (const { question, options } of questions) {
      const answer = answers.find((a) => a.questionId === question.id);
      let isCorrect = false;

      if (question.type === "short_answer") {
        isCorrect = !!answer?.shortAnswerText && normalize(answer.shortAnswerText) === normalize(question.correctAnswerText ?? "");
      } else {
        const selected = options.find((o) => o.id === answer?.selectedOptionId);
        isCorrect = !!selected?.isCorrect;
      }

      const pointsAwarded = isCorrect ? question.points : 0;
      totalScore += pointsAwarded;

      await QuizAnswerRepository.upsert({
        attemptId,
        questionId: question.id,
        selectedOptionId: answer?.selectedOptionId,
        shortAnswerText: answer?.shortAnswerText,
        isCorrect,
        pointsAwarded,
      });
    }

    await QuizAttemptRepository.markGraded(attemptId, totalScore);
    return { totalScore, maxPossibleScore: attempt.maxPossibleScore };
  },

  resultsForQuiz: (quizId: string) => QuizAttemptRepository.listForQuizWithStudent(quizId),

  async publishedQuizzesForStudent(courseId: string, studentId: string) {
    const quizzes = (await QuizRepository.listByCourse(courseId)).filter((q) => q.isPublished);
    return Promise.all(
      quizzes.map(async (quiz) => {
        const attemptsUsed = await QuizAttemptRepository.countForStudent(quiz.id, studentId);
        return { quiz, attemptsRemaining: Math.max(0, quiz.maxAttempts - attemptsUsed) };
      })
    );
  },
};
