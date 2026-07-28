"use client";

import { useActionState } from "react";

import { submitAttemptAction, type SubmitAttemptState } from "@/server/controllers/quiz-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const initialState: SubmitAttemptState = {};

type QuestionWithOptions = {
  question: { id: string; questionText: string; type: string; points: number };
  options: { id: string; optionText: string }[];
};

export function TakeQuizForm({ attemptId, questions }: { attemptId: string; questions: QuestionWithOptions[] }) {
  const [state, formAction, pending] = useActionState(submitAttemptAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="attemptId" value={attemptId} />
      {questions.map(({ question, options }, i) => (
        <Card key={question.id}>
          <CardContent className="flex flex-col gap-3 pt-6">
            <input type="hidden" name="questionId" value={question.id} />
            <p className="text-lg font-medium">
              {i + 1}. {question.questionText}{" "}
              <span className="text-sm font-normal text-muted-foreground">({question.points} poin)</span>
            </p>
            {question.type === "short_answer" ? (
              <Input name={`text_${question.id}`} placeholder="Jawabanmu" className="h-11" />
            ) : (
              <div className="flex flex-col gap-2">
                {options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-3 rounded-lg border p-3 text-base has-[:checked]:border-primary"
                  >
                    <input type="radio" name={`option_${question.id}`} value={opt.id} className="size-5" />
                    {opt.optionText}
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-fit">
        {pending ? "Mengirim…" : "Kirim kuis"}
      </Button>
    </form>
  );
}
