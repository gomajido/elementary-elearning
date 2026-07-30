"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { QuizService, QuizError } from "@/server/services/quiz-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { QUESTION_TYPES } from "@/lib/db/schema";

/** `ok` distinguishes a successful submit from the initial (unsubmitted) state, so dialogs can close themselves. */
export type ActionState = { error?: string; ok?: boolean };

const quizSchema = z.object({
  courseId: z.string().min(1),
  themeId: z.string().min(1),
  title: z.string().min(1),
  instructions: z.string().optional(),
  timeLimitMinutes: z.coerce.number().int().positive().optional(),
  maxAttempts: z.coerce.number().int().positive().default(1),
});

export async function createQuizAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = quizSchema.safeParse({
    courseId: formData.get("courseId"),
    themeId: formData.get("themeId"),
    title: formData.get("title"),
    instructions: formData.get("instructions") || undefined,
    timeLimitMinutes: formData.get("timeLimitMinutes") || undefined,
    maxAttempts: formData.get("maxAttempts") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await QuizService.createQuiz({ teacherUserId: user.id, ...parsed.data });
  } catch (err) {
    if (err instanceof QuizError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/teacher/courses/${parsed.data.courseId}`);
  return { ok: true };
}

const questionSchema = z.object({
  quizId: z.string().min(1),
  questionText: z.string().min(1),
  type: z.enum(QUESTION_TYPES),
  points: z.coerce.number().int().positive(),
  option1: z.string().optional(),
  option2: z.string().optional(),
  option3: z.string().optional(),
  option4: z.string().optional(),
  correctOption: z.string().optional(),
  correctBoolean: z.string().optional(),
  correctAnswerText: z.string().optional(),
});

export async function addQuestionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["teacher"]);
  const parsed = questionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const data = parsed.data;

  let options: { text: string; isCorrect: boolean }[] | undefined;
  if (data.type === "multiple_choice") {
    const texts = [data.option1, data.option2, data.option3, data.option4].filter((t): t is string => !!t);
    options = texts.map((text, i) => ({ text, isCorrect: String(i + 1) === data.correctOption }));
  } else if (data.type === "true_false") {
    options = [
      { text: "Benar", isCorrect: data.correctBoolean === "true" },
      { text: "Salah", isCorrect: data.correctBoolean === "false" },
    ];
  }

  try {
    await QuizService.addQuestion({
      teacherUserId: user.id,
      quizId: data.quizId,
      questionText: data.questionText,
      type: data.type,
      points: data.points,
      correctAnswerText: data.correctAnswerText,
      options,
    });
  } catch (err) {
    if (err instanceof QuizError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/teacher/quizzes/${data.quizId}`);
  return {};
}

export async function publishQuizAction(quizId: string) {
  const user = await requireRole(["teacher"]);
  await QuizService.publishQuiz(user.id, quizId);
  revalidatePath(`/teacher/quizzes/${quizId}`);
}

export async function startAttemptAction(quizId: string) {
  const user = await requireRole(["student"]);
  const student = await StudentRepository.findByUserId(user.id);
  if (!student) throw new QuizError("Tidak ada data siswa untuk akun ini");

  const attempt = await QuizService.startAttempt(student.id, quizId);
  redirect(`/student/quizzes/attempt/${attempt.id}`);
}

export type SubmitAttemptState = { error?: string; result?: { totalScore: number; maxPossibleScore: number } };

export async function submitAttemptAction(_prev: SubmitAttemptState, formData: FormData): Promise<SubmitAttemptState> {
  const user = await requireRole(["student"]);
  const student = await StudentRepository.findByUserId(user.id);
  if (!student) return { error: "Tidak ada data siswa untuk akun ini" };

  const attemptId = String(formData.get("attemptId"));
  const questionIds = formData.getAll("questionId").map(String);
  const answers = questionIds.map((questionId) => ({
    questionId,
    selectedOptionId: (formData.get(`option_${questionId}`) as string) || undefined,
    shortAnswerText: (formData.get(`text_${questionId}`) as string) || undefined,
  }));

  try {
    const result = await QuizService.submitAttempt(student.id, attemptId, answers);
    revalidatePath(`/student/quizzes/attempt/${attemptId}`);
    return { result };
  } catch (err) {
    if (err instanceof QuizError) return { error: err.message };
    throw err;
  }
}
