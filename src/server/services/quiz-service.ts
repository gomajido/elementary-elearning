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

export const QuizService = {
  listForCourse: (courseId: string) => QuizRepository.listByCourse(courseId),

  async createQuiz(input: {
    teacherUserId: string;
    courseId: string;
    title: string;
    instructions?: string;
    timeLimitMinutes?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
  }) {
    const teacher = await TeacherRepository.findByUserId(input.teacherUserId);
    const course = await CourseRepository.findById(input.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new QuizError("You do not own this course");

    return QuizRepository.create({
      courseId: input.courseId,
      title: input.title,
      instructions: input.instructions,
      timeLimitMinutes: input.timeLimitMinutes,
      maxAttempts: input.maxAttempts,
      shuffleQuestions: input.shuffleQuestions,
    });
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
    if (!quiz) throw new QuizError("Quiz not found");
    const course = await CourseRepository.findById(quiz.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new QuizError("You do not own this quiz");

    if (input.type !== "short_answer" && (!input.options || input.options.every((o) => !o.isCorrect))) {
      throw new QuizError("Mark exactly one option as correct");
    }
    if (input.type === "short_answer" && !input.correctAnswerText) {
      throw new QuizError("Short-answer questions need a correct answer");
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
    if (!quiz) throw new QuizError("Quiz not found");
    const course = await CourseRepository.findById(quiz.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new QuizError("You do not own this quiz");
    await QuizRepository.publish(quizId);
  },

  async startAttempt(studentId: string, quizId: string) {
    const quiz = await QuizRepository.findById(quizId);
    if (!quiz || !quiz.isPublished) throw new QuizError("Quiz not available");

    const attemptCount = await QuizAttemptRepository.countForStudent(quizId, studentId);
    if (attemptCount >= quiz.maxAttempts) throw new QuizError("No attempts remaining");

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
    return { attempt, quiz, questions, answers };
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
    if (!attempt || attempt.studentId !== studentId) throw new QuizError("Attempt not found");
    if (attempt.status !== "in_progress") throw new QuizError("Attempt already submitted");

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
