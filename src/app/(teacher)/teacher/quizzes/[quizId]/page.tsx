import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { QuizService } from "@/server/services/quiz-service";
import { QuizQuestionForm } from "@/components/forms/quiz-question-form";
import { PublishQuizButton } from "@/components/forms/publish-quiz-button";
import { QuizResultsTable } from "@/components/tables/quiz-results-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeacherQuizDetailPage({ params }: { params: Promise<{ quizId: string }> }) {
  await requireRole(["teacher"]);
  const { quizId } = await params;

  const detail = await QuizService.quizDetail(quizId);
  if (!detail) notFound();
  const results = await QuizService.resultsForQuiz(quizId);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{detail.quiz.title}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={detail.quiz.isPublished ? "secondary" : "outline"}>
            {detail.quiz.isPublished ? "Diterbitkan" : "Draf"}
          </Badge>
          <PublishQuizButton quizId={quizId} isPublished={detail.quiz.isPublished} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pertanyaan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {detail.questions.map(({ question, options }, i) => (
            <div key={question.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {i + 1}. {question.questionText} ({question.points} poin)
              </p>
              {question.type === "short_answer" ? (
                <p className="mt-1 text-muted-foreground">Jawaban: {question.correctAnswerText}</p>
              ) : (
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {options.map((o) => (
                    <li key={o.id} className={o.isCorrect ? "font-medium text-foreground" : undefined}>
                      {o.optionText} {o.isCorrect && "✓"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {detail.questions.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pertanyaan</p>}
          <QuizQuestionForm quizId={quizId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hasil</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizResultsTable rows={results} />
        </CardContent>
      </Card>
    </div>
  );
}
