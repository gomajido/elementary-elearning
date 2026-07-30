"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { submitAttemptAction, type SubmitAttemptState } from "@/server/controllers/quiz-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const initialState: SubmitAttemptState = {};

type QuestionWithOptions = {
  question: { id: string; questionText: string; type: string; points: number };
  options: { id: string; optionText: string }[];
};

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * `deadline` is an absolute instant from the server (startedAt + the quiz's
 * limit), so a reload doesn't hand back time. At zero the form submits itself
 * with whatever is filled in; the server re-checks against startedAt and
 * refuses anything arriving past its grace window.
 */
export function TakeQuizForm({
  attemptId,
  questions,
  deadline,
}: {
  attemptId: string;
  questions: QuestionWithOptions[];
  deadline?: string | null;
}) {
  const [state, formAction, pending] = useActionState(submitAttemptAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const autoSubmitted = useRef(false);
  const deadlineMs = deadline ? new Date(deadline).getTime() : null;
  const [remaining, setRemaining] = useState(() => (deadlineMs ? deadlineMs - Date.now() : null));

  useEffect(() => {
    if (deadlineMs === null) return;
    const tick = () => {
      const left = deadlineMs - Date.now();
      setRemaining(left);
      if (left <= 0 && !autoSubmitted.current) {
        autoSubmitted.current = true;
        formRef.current?.requestSubmit();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  const outOfTime = remaining !== null && remaining <= 0;
  const nearlyOut = remaining !== null && remaining > 0 && remaining <= 60_000;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="attemptId" value={attemptId} />

      {remaining !== null && (
        <div
          aria-live="polite"
          className={`sticky top-0 z-10 rounded-lg border bg-background px-4 py-2 text-base font-medium ${
            nearlyOut || outOfTime ? "text-destructive" : ""
          }`}
        >
          {outOfTime ? "Waktu habis — mengirim jawabanmu…" : `Sisa waktu ${formatRemaining(remaining)}`}
        </div>
      )}

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
      <Button type="submit" disabled={pending || outOfTime} size="lg" className="w-fit">
        {pending ? "Mengirim…" : "Kirim kuis"}
      </Button>
    </form>
  );
}
