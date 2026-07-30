"use client";

import { useActionState } from "react";

import { updateTeacherAction, type UpdateTeacherState } from "@/server/controllers/teacher-controller";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UpdateTeacherState = {};

export function EditTeacherForm({
  teacher,
  photoStorageKey,
  photoUpdatedAt,
}: {
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    phone: string | null;
    hireDate: string | null;
  };
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
}) {
  const [state, formAction, pending] = useActionState(updateTeacherAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="teacherId" value={teacher.id} />
      <PhotoUploadField
        entityType="teacher"
        entityId={teacher.id}
        name={`${teacher.firstName} ${teacher.lastName}`}
        initialStorageKey={photoStorageKey}
        initialUpdatedAt={photoUpdatedAt}
        revalidateTarget="/admin/teachers"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">Nama depan</Label>
          <Input id="firstName" name="firstName" defaultValue={teacher.firstName} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Nama belakang</Label>
          <Input id="lastName" name="lastName" defaultValue={teacher.lastName} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="employeeNumber">Nomor pegawai</Label>
          <Input id="employeeNumber" name="employeeNumber" defaultValue={teacher.employeeNumber} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telepon (opsional)</Label>
          <Input id="phone" name="phone" defaultValue={teacher.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="hireDate">Tanggal masuk kerja (opsional)</Label>
          <Input id="hireDate" name="hireDate" type="date" defaultValue={teacher.hireDate ?? ""} />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
