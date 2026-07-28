"use client";

import { useActionState } from "react";

import { createClassAction, type ActionState } from "@/server/controllers/academic-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: ActionState = {};

export function ClassForm({
  academicYears,
  teachers,
}: {
  academicYears: { id: string; name: string }[];
  teachers: { id: string; firstName: string; lastName: string }[];
}) {
  const [state, formAction, pending] = useActionState(createClassAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Class name</Label>
        <Input id="name" name="name" placeholder="Primary 3" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="section">Section (optional)</Label>
        <Input id="section" name="section" placeholder="B" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeLevel">Grade level (0 = Kindergarten)</Label>
        <Input id="gradeLevel" name="gradeLevel" type="number" min={0} max={12} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">Capacity (optional)</Label>
        <Input id="capacity" name="capacity" type="number" min={1} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Academic year</Label>
        <Select
          name="academicYearId"
          required
          items={Object.fromEntries(academicYears.map((year) => [year.id, year.name]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Class teacher (optional)</Label>
        <Select
          name="classTeacherId"
          items={Object.fromEntries(teachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-3 sm:w-fit">
        {pending ? "Adding…" : "Add class"}
      </Button>
    </form>
  );
}
