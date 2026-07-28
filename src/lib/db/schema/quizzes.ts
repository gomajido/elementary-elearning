import { pgTable, text, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";

import { id, schoolId, timestamps } from "./_shared";
import { courses } from "./elearning";
import { students } from "./people";

export const quizzes = pgTable("quizzes", {
  id: id(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  title: text("title").notNull(),
  instructions: text("instructions"),
  timeLimitMinutes: integer("time_limit_minutes"),
  maxAttempts: integer("max_attempts").notNull().default(1),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
  availableFrom: timestamp("available_from", { mode: "date" }),
  availableUntil: timestamp("available_until", { mode: "date" }),
  isPublished: boolean("is_published").notNull().default(false),
  schoolId: schoolId(),
  ...timestamps,
});

export const QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const quizQuestions = pgTable("quiz_questions", {
  id: id(),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id),
  orderIndex: integer("order_index").notNull().default(0),
  questionText: text("question_text").notNull(),
  type: text("type").notNull().$type<QuestionType>(),
  points: integer("points").notNull().default(1),
  // Used only when type = 'short_answer' — normalized (trim + lowercase)
  // exact-match auto-grading, with teacher override on the attempt.
  correctAnswerText: text("correct_answer_text"),
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});

// For multiple_choice / true_false question types.
export const quizQuestionOptions = pgTable("quiz_question_options", {
  id: id(),
  questionId: text("question_id")
    .notNull()
    .references(() => quizQuestions.id),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  schoolId: schoolId(),
});

export const ATTEMPT_STATUSES = ["in_progress", "submitted", "auto_graded"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const quizAttempts = pgTable("quiz_attempts", {
  id: id(),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  startedAt: timestamp("started_at", { mode: "date" }).notNull(),
  submittedAt: timestamp("submitted_at", { mode: "date" }),
  attemptNumber: integer("attempt_number").notNull().default(1),
  totalScore: integer("total_score"),
  maxPossibleScore: integer("max_possible_score").notNull(),
  status: text("status").notNull().$type<AttemptStatus>().default("in_progress"),
  schoolId: schoolId(),
  createdAt: timestamps.createdAt,
});

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: id(),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => quizAttempts.id),
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestions.id),
    selectedOptionId: text("selected_option_id").references(() => quizQuestionOptions.id),
    shortAnswerText: text("short_answer_text"),
    isCorrect: boolean("is_correct"),
    pointsAwarded: integer("points_awarded"),
    schoolId: schoolId(),
    createdAt: timestamps.createdAt,
  },
  (t) => [unique().on(t.attemptId, t.questionId)]
);
