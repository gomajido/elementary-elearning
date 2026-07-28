"use client";

import { useActionState } from "react";

import { gradeSubmissionAction, type ActionState } from "@/server/controllers/assignment-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = {};

export function GradeSubmissionForm({ submissionId, maxScore }: { submissionId: string; maxScore: number }) {
  const [state, formAction, pending] = useActionState(gradeSubmissionAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="submissionId" value={submissionId} />
      <Input name="score" type="number" min={0} max={maxScore} placeholder={`/ ${maxScore}`} className="h-8 w-20" required />
      <Input name="feedback" placeholder="Feedback (optional)" className="h-8 w-48" />
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "…" : "Grade"}
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
