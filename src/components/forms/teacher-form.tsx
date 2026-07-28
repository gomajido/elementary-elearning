"use client";

import { useActionState } from "react";

import { createTeacherAction, type CreateTeacherState } from "@/server/controllers/teacher-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateTeacherState = {};

export function TeacherForm() {
  const [state, formAction, pending] = useActionState(createTeacherAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">Nama depan</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Nama belakang</Label>
          <Input id="lastName" name="lastName" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="employeeNumber">Nomor pegawai</Label>
          <Input id="employeeNumber" name="employeeNumber" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telepon (opsional)</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="hireDate">Tanggal masuk kerja (opsional)</Label>
          <Input id="hireDate" name="hireDate" type="date" />
        </div>
        {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
        <Button type="submit" disabled={pending} className="sm:col-span-3 sm:w-fit">
          {pending ? "Membuat…" : "Buat akun guru"}
        </Button>
      </form>

      {state.tempPassword && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950">
          <p className="font-medium">Akun dibuat untuk {state.email}</p>
          <p className="mt-1">
            Kata sandi sementara: <code className="rounded bg-background px-1.5 py-0.5">{state.tempPassword}</code>
          </p>
          <p className="mt-1 text-muted-foreground">
            Bagikan ini ke guru sekarang — tidak akan ditampilkan lagi. Mereka harus menggantinya saat pertama kali masuk.
          </p>
        </div>
      )}
    </div>
  );
}
