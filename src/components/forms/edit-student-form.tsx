"use client";

import { useActionState } from "react";

import { updateStudentAction, type UpdateStudentState } from "@/server/controllers/student-controller";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENROLLMENT_STATUS_LABELS, GENDER_LABELS, label } from "@/lib/labels";
import { ENROLLMENT_STATUSES, GENDERS, type EnrollmentStatus, type Gender } from "@/lib/db/schema";

const initialState: UpdateStudentState = {};

export function EditStudentForm({
  student,
  classes,
  photoStorageKey,
  photoUpdatedAt,
}: {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    currentClassId: string | null;
    enrollmentDate: string;
    enrollmentStatus: EnrollmentStatus;
  };
  classes: { id: string; name: string; section: string | null }[];
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
}) {
  const [state, formAction, pending] = useActionState(updateStudentAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="studentId" value={student.id} />
      <PhotoUploadField
        entityType="student"
        entityId={student.id}
        name={`${student.firstName} ${student.lastName}`}
        initialStorageKey={photoStorageKey}
        initialUpdatedAt={photoUpdatedAt}
        revalidateTarget="/admin/students"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="admissionNumber">Nomor induk</Label>
          <Input id="admissionNumber" name="admissionNumber" defaultValue={student.admissionNumber} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">Nama depan</Label>
          <Input id="firstName" name="firstName" defaultValue={student.firstName} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Nama belakang</Label>
          <Input id="lastName" name="lastName" defaultValue={student.lastName} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateOfBirth">Tanggal lahir</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={student.dateOfBirth} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Jenis kelamin</Label>
          <Select
            key={student.gender}
            name="gender"
            required
            defaultValue={student.gender}
            items={Object.fromEntries(GENDERS.map((g) => [g, label(GENDER_LABELS, g)]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g} value={g}>
                  {label(GENDER_LABELS, g)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="enrollmentDate">Tanggal masuk</Label>
          <Input id="enrollmentDate" name="enrollmentDate" type="date" defaultValue={student.enrollmentDate} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Kelas</Label>
          <Select
            key={student.currentClassId}
            name="classId"
            required
            defaultValue={student.currentClassId ?? undefined}
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
          <Label>Status</Label>
          <Select
            key={student.enrollmentStatus}
            name="enrollmentStatus"
            required
            defaultValue={student.enrollmentStatus}
            items={Object.fromEntries(ENROLLMENT_STATUSES.map((s) => [s, label(ENROLLMENT_STATUS_LABELS, s)]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              {ENROLLMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {label(ENROLLMENT_STATUS_LABELS, s)}
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
