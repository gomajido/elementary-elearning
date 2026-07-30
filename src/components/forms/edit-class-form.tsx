"use client";

import { useActionState, useEffect } from "react";

import { updateClassAction, type ActionState } from "@/server/controllers/academic-controller";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: ActionState = {};

export function EditClassForm({
  onSuccess,
  classRow,
  academicYears,
  teachers,
  photoStorageKey,
  photoUpdatedAt,
}: {
  classRow: {
    id: string;
    name: string;
    section: string | null;
    gradeLevel: number;
    academicYearId: string;
    classTeacherId: string | null;
    capacity: number | null;
  };
  academicYears: { id: string; name: string }[];
  teachers: { id: string; firstName: string; lastName: string }[];
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateClassAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="classId" value={classRow.id} />
      <PhotoUploadField
        entityType="class"
        entityId={classRow.id}
        name={classRow.name}
        initialStorageKey={photoStorageKey}
        initialUpdatedAt={photoUpdatedAt}
        revalidateTarget="/admin/classes"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nama kelas</Label>
          <Input id="name" name="name" defaultValue={classRow.name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="section">Rombel (opsional)</Label>
          <Input id="section" name="section" defaultValue={classRow.section ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gradeLevel">Tingkat (0 = TK)</Label>
          <Input id="gradeLevel" name="gradeLevel" type="number" min={0} max={12} defaultValue={classRow.gradeLevel} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="capacity">Kapasitas (opsional)</Label>
          <Input id="capacity" name="capacity" type="number" min={1} defaultValue={classRow.capacity ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tahun ajaran</Label>
          <Select
            key={classRow.academicYearId}
            name="academicYearId"
            required
            defaultValue={classRow.academicYearId}
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
            key={classRow.classTeacherId}
            name="classTeacherId"
            defaultValue={classRow.classTeacherId ?? undefined}
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
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
