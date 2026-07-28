"use client";

import { useActionState } from "react";

import { createAssignmentAction, type ActionState } from "@/server/controllers/assignment-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function AssignmentForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(createAssignmentAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="instructions">Instructions (optional)</Label>
        <Textarea id="instructions" name="instructions" rows={3} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dueDate">Due date</Label>
        <Input id="dueDate" name="dueDate" type="date" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="maxScore">Max score</Label>
        <Input id="maxScore" name="maxScore" type="number" min={1} required />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allowLateSubmission" defaultChecked />
        Allow late submission
      </label>
      {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Creating…" : "Create assignment"}
      </Button>
    </form>
  );
}
