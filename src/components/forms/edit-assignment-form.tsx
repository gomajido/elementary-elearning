"use client";

import { useActionState, useEffect } from "react";

import { updateAssignmentAction, type ActionState } from "@/server/controllers/assignment-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function EditAssignmentForm({
  assignment,
  onSuccess,
}: {
  assignment: {
    id: string;
    title: string;
    instructions: string | null;
    dueDate: string;
    maxScore: number;
    allowLateSubmission: boolean;
  };
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateAssignmentAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="assignmentId" value={assignment.id} />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="edit-assignment-title">Judul</Label>
        <Input id="edit-assignment-title" name="title" defaultValue={assignment.title} required />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="edit-assignment-instructions">Instruksi (opsional)</Label>
        <Textarea
          id="edit-assignment-instructions"
          name="instructions"
          rows={3}
          defaultValue={assignment.instructions ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-assignment-due">Tenggat waktu</Label>
        <Input id="edit-assignment-due" name="dueDate" type="date" defaultValue={assignment.dueDate} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-assignment-max">Nilai maksimal</Label>
        <Input
          id="edit-assignment-max"
          name="maxScore"
          type="number"
          min={1}
          defaultValue={assignment.maxScore}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allowLateSubmission" defaultChecked={assignment.allowLateSubmission} />
        Izinkan pengumpulan terlambat
      </label>
      {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
