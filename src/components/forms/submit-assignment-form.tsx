"use client";

import { useActionState } from "react";

import { submitAssignmentAction, type ActionState } from "@/server/controllers/assignment-controller";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function SubmitAssignmentForm({ assignmentId, defaultText }: { assignmentId: string; defaultText?: string }) {
  const [state, formAction, pending] = useActionState(submitAssignmentAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Textarea name="textResponse" rows={5} defaultValue={defaultText} placeholder="Write your answer here…" required />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-fit">
        {pending ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
