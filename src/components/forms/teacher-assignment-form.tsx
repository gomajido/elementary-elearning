"use client";

import { useActionState } from "react";

import { assignTeacherAction, type ActionState } from "@/server/controllers/academic-controller";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: ActionState = {};

export function TeacherAssignmentForm({
  teachers,
  classes,
  subjects,
  academicYears,
}: {
  teachers: { id: string; firstName: string; lastName: string }[];
  classes: { id: string; name: string; section: string | null }[];
  subjects: { id: string; name: string }[];
  academicYears: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(assignTeacherAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-4 sm:items-end">
      <div className="flex flex-col gap-2">
        <Label>Teacher</Label>
        <Select
          name="teacherId"
          required
          items={Object.fromEntries(teachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Class</Label>
        <Select
          name="classId"
          required
          items={Object.fromEntries(classes.map((c) => [c.id, `${c.name}${c.section ? ` ${c.section}` : ""}`]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.section ? ` ${c.section}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Subject</Label>
        <Select name="subjectId" required items={Object.fromEntries(subjects.map((s) => [s.id, s.name]))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
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
            <SelectValue placeholder="Year" />
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
      {state.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-4 sm:w-fit">
        {pending ? "Assigning…" : "Assign teacher"}
      </Button>
    </form>
  );
}
