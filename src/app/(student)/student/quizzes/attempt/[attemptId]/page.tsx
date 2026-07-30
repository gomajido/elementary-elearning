import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { QuizService } from "@/server/services/quiz-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { TakeQuizForm } from "@/components/forms/take-quiz-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function QuizAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireRole(["student"]);
  const { attemptId } = await params;

  const student = await StudentRepository.findByUserId(user.id);
  if (!student) notFound();

  const detail = await QuizService.attemptDetail(attemptId);
  if (!detail || detail.attempt.studentId !== student.id) notFound();

  if (detail.attempt.status === "in_progress") {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">{detail.quiz?.title}</h1>
        <TakeQuizForm
          attemptId={attemptId}
          questions={detail.questions}
          deadline={detail.deadline?.toISOString() ?? null}
        />
      </div>
    );
  }

  const answersByQuestion = new Map(detail.answers.map((a) => [a.questionId, a]));

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">
          {detail.quiz?.title} — Nilai: {detail.attempt.totalScore} / {detail.attempt.maxPossibleScore}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {detail.questions.map(({ question, options }, i) => {
          const answer = answersByQuestion.get(question.id);
          const chosenOption = options.find((o) => o.id === answer?.selectedOptionId);
          return (
            <div key={question.id} className="rounded-lg border p-4">
              <p className="font-medium">
                {i + 1}. {question.questionText}{" "}
                <span className={answer?.isCorrect ? "text-emerald-600" : "text-destructive"}>
                  {answer?.isCorrect ? "✓ Benar" : "✗ Salah"}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Jawabanmu: {question.type === "short_answer" ? answer?.shortAnswerText : chosenOption?.optionText}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
