"use client";

import { useActionState } from "react";

import { createClassAction, type ActionState } from "@/server/controllers/academic-controller";
import { useActionSuccess } from "@/lib/hooks/use-action-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: ActionState = {};

export function ClassForm({
  academicYears,
  teachers,
  onSuccess,
}: {
  academicYears: { id: string; name: string }[];
  teachers: { id: string; firstName: string; lastName: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createClassAction, initialState);
  useActionSuccess(pending, state.error, onSuccess);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama kelas</Label>
        <Input id="name" name="name" placeholder="Kelas 3" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="section">Rombel (opsional)</Label>
        <Input id="section" name="section" placeholder="B" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeLevel">Tingkat (0 = TK)</Label>
        <Input id="gradeLevel" name="gradeLevel" type="number" min={0} max={12} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">Kapasitas (opsional)</Label>
        <Input id="capacity" name="capacity" type="number" min={1} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Tahun ajaran</Label>
        <Select
          name="academicYearId"
          required
          items={Object.fromEntries(academicYears.map((year) => [year.id, year.name]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih tahun" />
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
        <Label>Wali kelas (opsional)</Label>
        <Select
          name="classTeacherId"
          items={Object.fromEntries(teachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih guru" />
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
        {pending ? "Menambahkan…" : "Tambah kelas"}
      </Button>
    </form>
  );
}
