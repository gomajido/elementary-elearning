"use client";

import { useActionState } from "react";

import { createFeeStructureAction, type ActionState } from "@/server/controllers/fee-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEE_FREQUENCIES } from "@/lib/db/schema";

const initialState: ActionState = {};

export function FeeStructureForm({ academicYears }: { academicYears: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createFeeStructureAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Fee name</Label>
        <Input id="name" name="name" placeholder="Tuition Term 1" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Frequency</Label>
        <Select
          name="frequency"
          required
          items={Object.fromEntries(FEE_FREQUENCIES.map((f) => [f, f.replace("_", " ")]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {FEE_FREQUENCIES.map((f) => (
              <SelectItem key={f} value={f}>
                {f.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Academic year</Label>
        <Select
          name="academicYearId"
          required
          items={Object.fromEntries(academicYears.map((y) => [y.id, y.name]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeLevel">Grade level (optional, applies to all if blank)</Label>
        <Input id="gradeLevel" name="gradeLevel" type="number" min={0} max={12} />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Adding…" : "Add fee"}
      </Button>
    </form>
  );
}
