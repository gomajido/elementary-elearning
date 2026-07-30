"use client";

import { useActionState } from "react";

import { updateAcademicYearAction, type ActionState } from "@/server/controllers/academic-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function EditAcademicYearForm({
  year,
}: {
  year: { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean };
}) {
  const [state, formAction, pending] = useActionState(updateAcademicYearAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="academicYearId" value={year.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nama</Label>
          <Input id="name" name="name" defaultValue={year.name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Tanggal mulai</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={year.startDate} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">Tanggal selesai</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={year.endDate} required />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input id="isCurrent" name="isCurrent" type="checkbox" className="size-4" defaultChecked={year.isCurrent} />
          <Label htmlFor="isCurrent">Jadikan tahun aktif</Label>
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
