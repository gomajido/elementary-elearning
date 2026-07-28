"use client";

import { useActionState } from "react";

import { createFeeStructureAction, type ActionState } from "@/server/controllers/fee-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEE_FREQUENCIES } from "@/lib/db/schema";
import { FEE_FREQUENCY_LABELS } from "@/lib/labels";

const initialState: ActionState = {};

export function FeeStructureForm({ academicYears }: { academicYears: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createFeeStructureAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama biaya</Label>
        <Input id="name" name="name" placeholder="SPP Semester 1" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Jumlah</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Frekuensi</Label>
        <Select
          name="frequency"
          required
          items={Object.fromEntries(FEE_FREQUENCIES.map((f) => [f, FEE_FREQUENCY_LABELS[f]]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih" />
          </SelectTrigger>
          <SelectContent>
            {FEE_FREQUENCIES.map((f) => (
              <SelectItem key={f} value={f}>
                {FEE_FREQUENCY_LABELS[f]}
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeLevel">Tingkat (opsional, kosongkan untuk semua)</Label>
        <Input id="gradeLevel" name="gradeLevel" type="number" min={0} max={12} />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Menambahkan…" : "Tambah biaya"}
      </Button>
    </form>
  );
}
