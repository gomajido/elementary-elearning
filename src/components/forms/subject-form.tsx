"use client";

import { useActionState } from "react";

import { createSubjectAction, type ActionState } from "@/server/controllers/academic-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function SubjectForm() {
  const [state, formAction, pending] = useActionState(createSubjectAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama mata pelajaran</Label>
        <Input id="name" name="name" placeholder="Matematika" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Kode (opsional)</Label>
        <Input id="code" name="code" placeholder="MTK" />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Menambahkan…" : "Tambah mata pelajaran"}
      </Button>
    </form>
  );
}
