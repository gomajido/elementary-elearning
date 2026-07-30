"use client";

import { useActionState, useEffect } from "react";

import { updateFeeStructureAction, type ActionState } from "@/server/controllers/fee-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEE_FREQUENCIES, type FeeFrequency } from "@/lib/db/schema";
import { FEE_FREQUENCY_LABELS } from "@/lib/labels";

const initialState: ActionState = {};

export function EditFeeStructureForm({
  onSuccess,
  structure,
  academicYears,
}: {
  structure: {
    id: string;
    name: string;
    amountCents: number;
    frequency: FeeFrequency;
    academicYearId: string;
    gradeLevel: number | null;
  };
  academicYears: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateFeeStructureAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="feeStructureId" value={structure.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nama biaya</Label>
          <Input id="name" name="name" defaultValue={structure.name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Jumlah</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={structure.amountCents / 100}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Frekuensi</Label>
          <Select
            key={structure.frequency}
            name="frequency"
            required
            defaultValue={structure.frequency}
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
            key={structure.academicYearId}
            name="academicYearId"
            required
            defaultValue={structure.academicYearId}
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
          <Input id="gradeLevel" name="gradeLevel" type="number" min={0} max={12} defaultValue={structure.gradeLevel ?? ""} />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
