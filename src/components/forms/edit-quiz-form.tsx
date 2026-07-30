"use client";

import { useActionState, useEffect } from "react";

import { updateQuizAction, type ActionState } from "@/server/controllers/quiz-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function EditQuizForm({
  quiz,
  onSuccess,
}: {
  quiz: { id: string; title: string; timeLimitMinutes: number | null; maxAttempts: number };
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateQuizAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="quizId" value={quiz.id} />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="edit-quiz-title">Judul</Label>
        <Input id="edit-quiz-title" name="title" defaultValue={quiz.title} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-quiz-limit">Batas waktu, menit (opsional)</Label>
        <Input
          id="edit-quiz-limit"
          name="timeLimitMinutes"
          type="number"
          min={1}
          defaultValue={quiz.timeLimitMinutes ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-quiz-attempts">Percobaan maksimal</Label>
        <Input
          id="edit-quiz-attempts"
          name="maxAttempts"
          type="number"
          min={1}
          defaultValue={quiz.maxAttempts}
          required
        />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
