"use client";

import { useActionState } from "react";

import { createQuizAction, type ActionState } from "@/server/controllers/quiz-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function QuizForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(createQuizAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex flex-col gap-2 sm:col-span-3">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="timeLimitMinutes">Time limit, minutes (optional)</Label>
        <Input id="timeLimitMinutes" name="timeLimitMinutes" type="number" min={1} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="maxAttempts">Max attempts</Label>
        <Input id="maxAttempts" name="maxAttempts" type="number" min={1} defaultValue={1} />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Creating…" : "Create quiz"}
      </Button>
    </form>
  );
}
