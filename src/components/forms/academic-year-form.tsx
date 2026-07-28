"use client";

import { useActionState } from "react";

import { createAcademicYearAction, type ActionState } from "@/server/controllers/academic-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function AcademicYearForm() {
  const [state, formAction, pending] = useActionState(createAcademicYearAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-4 sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="2026/2027" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input id="startDate" name="startDate" type="date" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="endDate">End date</Label>
        <Input id="endDate" name="endDate" type="date" required />
      </div>
      <div className="flex items-center gap-2 pb-2">
        <input id="isCurrent" name="isCurrent" type="checkbox" className="size-4" />
        <Label htmlFor="isCurrent">Set as current year</Label>
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-4 sm:w-fit">
        {pending ? "Adding…" : "Add academic year"}
      </Button>
    </form>
  );
}
