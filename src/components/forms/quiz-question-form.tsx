"use client";

import { useActionState, useState } from "react";

import { addQuestionAction, type ActionState } from "@/server/controllers/quiz-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

type QType = "multiple_choice" | "true_false" | "short_answer";

export function QuizQuestionForm({ quizId }: { quizId: string }) {
  const [state, formAction, pending] = useActionState(addQuestionAction, initialState);
  const [type, setType] = useState<QType>("multiple_choice");

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <input type="hidden" name="quizId" value={quizId} />
      <div className="flex gap-4 text-sm">
        {(["multiple_choice", "true_false", "short_answer"] as const).map((t) => (
          <label key={t} className="flex items-center gap-2">
            <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} />
            {t.replace("_", " ")}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="questionText">Question</Label>
        <Input id="questionText" name="questionText" required />
      </div>
      <div className="flex flex-col gap-2 sm:w-32">
        <Label htmlFor="points">Points</Label>
        <Input id="points" name="points" type="number" min={1} defaultValue={1} required />
      </div>

      {type === "multiple_choice" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Options — mark the correct one</p>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <input type="radio" name="correctOption" value={String(n)} required={n === 1} />
              <Input name={`option${n}`} placeholder={`Option ${n}${n > 2 ? " (optional)" : ""}`} required={n <= 2} />
            </div>
          ))}
        </div>
      )}

      {type === "true_false" && (
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="correctBoolean" value="true" required />
            True is correct
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="correctBoolean" value="false" />
            False is correct
          </label>
        </div>
      )}

      {type === "short_answer" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="correctAnswerText">Correct answer</Label>
          <Input id="correctAnswerText" name="correctAnswerText" required />
        </div>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Adding…" : "Add question"}
      </Button>
    </form>
  );
}
