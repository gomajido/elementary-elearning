"use client";

import { useActionState } from "react";

import { createSubjectAction, type ActionState } from "@/server/controllers/academic-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function SubjectForm() {
  const [state, formAction, pending] = useActionState(createSubjectAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Subject name</Label>
        <Input id="name" name="name" placeholder="Mathematics" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code (optional)</Label>
        <Input id="code" name="code" placeholder="MATH" />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Adding…" : "Add subject"}
      </Button>
    </form>
  );
}
