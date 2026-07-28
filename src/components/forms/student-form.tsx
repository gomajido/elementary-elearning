"use client";

import { useActionState, useState } from "react";

import { createStudentAction, type CreateStudentState } from "@/server/controllers/student-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: CreateStudentState = {};

const RELATIONSHIPS = [
  { value: "mother", label: "Ibu" },
  { value: "father", label: "Ayah" },
  { value: "guardian", label: "Wali" },
  { value: "other", label: "Lainnya" },
] as const;

export function StudentForm({
  classes,
  academicYears,
}: {
  classes: { id: string; name: string; section: string | null }[];
  academicYears: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createStudentAction, initialState);
  const [showSecondGuardian, setShowSecondGuardian] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="admissionNumber">Nomor induk</Label>
          <Input id="admissionNumber" name="admissionNumber" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">Nama depan</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Nama belakang</Label>
          <Input id="lastName" name="lastName" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateOfBirth">Tanggal lahir</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gender">Jenis kelamin (opsional)</Label>
          <Input id="gender" name="gender" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="enrollmentDate">Tanggal masuk</Label>
          <Input id="enrollmentDate" name="enrollmentDate" type="date" required />
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
      </div>

      <Separator />

      <div>
        <p className="mb-3 text-sm font-medium">Wali utama</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="guardian1FirstName">Nama depan</Label>
            <Input id="guardian1FirstName" name="guardian1FirstName" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guardian1LastName">Nama belakang</Label>
            <Input id="guardian1LastName" name="guardian1LastName" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Hubungan</Label>
            <Select
              name="guardian1Relationship"
              required
              items={Object.fromEntries(RELATIONSHIPS.map((r) => [r.value, r.label]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guardian1Phone">Telepon (opsional)</Label>
            <Input id="guardian1Phone" name="guardian1Phone" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guardian1Email">Email (opsional)</Label>
            <Input id="guardian1Email" name="guardian1Email" type="email" />
          </div>
        </div>
      </div>

      {showSecondGuardian ? (
        <div>
          <p className="mb-3 text-sm font-medium">Wali kedua</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardian2FirstName">Nama depan</Label>
              <Input id="guardian2FirstName" name="guardian2FirstName" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardian2LastName">Nama belakang</Label>
              <Input id="guardian2LastName" name="guardian2LastName" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Hubungan</Label>
              <Select name="guardian2Relationship" items={Object.fromEntries(RELATIONSHIPS.map((r) => [r.value, r.label]))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardian2Phone">Telepon (opsional)</Label>
              <Input id="guardian2Phone" name="guardian2Phone" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardian2Email">Email (opsional)</Label>
              <Input id="guardian2Email" name="guardian2Email" type="email" />
            </div>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setShowSecondGuardian(true)}>
          + Tambah wali kedua
        </Button>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Mendaftarkan…" : "Daftarkan siswa"}
      </Button>
    </form>
  );
}
