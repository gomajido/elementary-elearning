import { eq, and, desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  quizzes,
  quizQuestions,
  quizQuestionOptions,
  quizAttempts,
  quizAnswers,
  students,
  courses,
  type QuestionType,
} from "@/lib/db/schema";

export const QuizRepository = {
  async listByCourse(courseId: string) {
    const db = getDb();
    return db.select().from(quizzes).where(eq(quizzes.courseId, courseId)).orderBy(desc(quizzes.createdAt));
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    return row ?? null;
  },

  async create(input: {
    courseId: string;
    title: string;
    instructions?: string;
    timeLimitMinutes?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
  }) {
    const db = getDb();
    const [row] = await db.insert(quizzes).values(input).returning();
    return row;
  },

  async publish(id: string) {
    const db = getDb();
    await db.update(quizzes).set({ isPublished: true, updatedAt: new Date() }).where(eq(quizzes.id, id));
  },
};

export const QuizQuestionRepository = {
  async listWithOptionsByQuiz(quizId: string) {
    const db = getDb();
    const questionRows = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.orderIndex);
    if (questionRows.length === 0) return [];

    const rows = await db
      .select({ question: quizQuestions, option: quizQuestionOptions })
      .from(quizQuestions)
      .leftJoin(quizQuestionOptions, eq(quizQuestionOptions.questionId, quizQuestions.id))
      .where(eq(quizQuestions.quizId, quizId));

    const optionsByQuestion = new Map<string, NonNullable<(typeof rows)[number]["option"]>[]>();
    for (const row of rows) {
      if (!row.option) continue;
      const option = row.option;
      const list = optionsByQuestion.get(row.question.id) ?? [];
      list.push(option);
      optionsByQuestion.set(row.question.id, list);
    }
    return questionRows.map((q) => ({ question: q, options: optionsByQuestion.get(q.id) ?? [] }));
  },

  async create(input: {
    quizId: string;
    orderIndex: number;
    questionText: string;
    type: QuestionType;
    points: number;
    correctAnswerText?: string;
  }) {
    const db = getDb();
    const [row] = await db.insert(quizQuestions).values(input).returning();
    return row;
  },

  async createOption(input: { questionId: string; optionText: string; isCorrect: boolean; orderIndex: number }) {
    const db = getDb();
    const [row] = await db.insert(quizQuestionOptions).values(input).returning();
    return row;
  },
};

export const QuizAttemptRepository = {
  async countForStudent(quizId: string, studentId: string) {
    const db = getDb();
    const rows = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, studentId)));
    return rows.length;
  },

  async create(input: { quizId: string; studentId: string; attemptNumber: number; maxPossibleScore: number }) {
    const db = getDb();
    const [row] = await db
      .insert(quizAttempts)
      .values({ ...input, startedAt: new Date(), status: "in_progress" })
      .returning();
    return row;
  },

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id)).limit(1);
    return row ?? null;
  },

  async listForStudent(studentId: string) {
    const db = getDb();
    return db.select().from(quizAttempts).where(eq(quizAttempts.studentId, studentId));
  },

  async listGradedForCourse(courseId: string) {
    const db = getDb();
    return db
      .select({ attempt: quizAttempts, quiz: quizzes, student: students })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .innerJoin(students, eq(quizAttempts.studentId, students.id))
      .where(and(eq(quizzes.courseId, courseId), eq(quizAttempts.status, "auto_graded")));
  },

  async listForStudentWithDetails(studentId: string) {
    const db = getDb();
    return db
      .select({ attempt: quizAttempts, quiz: quizzes, courseTitle: courses.title })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .where(eq(quizAttempts.studentId, studentId));
  },

  async listForQuizWithStudent(quizId: string) {
    const db = getDb();
    return db
      .select({ attempt: quizAttempts, student: students })
      .from(quizAttempts)
      .innerJoin(students, eq(quizAttempts.studentId, students.id))
      .where(eq(quizAttempts.quizId, quizId));
  },

  async markGraded(id: string, totalScore: number) {
    const db = getDb();
    await db
      .update(quizAttempts)
      .set({ status: "auto_graded", totalScore, submittedAt: new Date() })
      .where(eq(quizAttempts.id, id));
  },
};

export const QuizAnswerRepository = {
  async upsert(input: {
    attemptId: string;
    questionId: string;
    selectedOptionId?: string;
    shortAnswerText?: string;
    isCorrect: boolean;
    pointsAwarded: number;
  }) {
    const db = getDb();
    const [row] = await db
      .insert(quizAnswers)
      .values(input)
      .onConflictDoUpdate({
        target: [quizAnswers.attemptId, quizAnswers.questionId],
        set: {
          selectedOptionId: input.selectedOptionId,
          shortAnswerText: input.shortAnswerText,
          isCorrect: input.isCorrect,
          pointsAwarded: input.pointsAwarded,
        },
      })
      .returning();
    return row;
  },

  async listByAttempt(attemptId: string) {
    const db = getDb();
    return db.select().from(quizAnswers).where(eq(quizAnswers.attemptId, attemptId));
  },
};
