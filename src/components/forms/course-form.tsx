"use client";

import { useActionState } from "react";

import { createCourseAction, type ActionState } from "@/server/controllers/course-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: ActionState = {};

export function CourseForm({
  subjects,
  classes,
  academicYears,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string; section: string | null }[];
  academicYears: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCourseAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" placeholder="Pecahan & Desimal" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Deskripsi (opsional)</Label>
        <Input id="description" name="description" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Mata pelajaran</Label>
        <Select name="subjectId" required items={Object.fromEntries(subjects.map((s) => [s.id, s.name]))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih mata pelajaran" />
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
        <Label>Kelas</Label>
        <Select
          name="classId"
          required
          items={Object.fromEntries(classes.map((c) => [c.id, `${c.name}${c.section ? ` ${c.section}` : ""}`]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih kelas" />
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
        <Label>Tahun ajaran</Label>
        <Select
          name="academicYearId"
          required
          items={Object.fromEntries(academicYears.map((y) => [y.id, y.name]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih tahun" />
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
      {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Membuat…" : "Buat kursus"}
      </Button>
    </form>
  );
}
