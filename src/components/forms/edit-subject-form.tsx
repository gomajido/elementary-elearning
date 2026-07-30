"use client";

import { useActionState } from "react";

import { updateSubjectAction, type ActionState } from "@/server/controllers/academic-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function EditSubjectForm({ subject }: { subject: { id: string; name: string; code: string | null } }) {
  const [state, formAction, pending] = useActionState(updateSubjectAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="subjectId" value={subject.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nama mata pelajaran</Label>
          <Input id="name" name="name" defaultValue={subject.name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Kode (opsional)</Label>
          <Input id="code" name="code" defaultValue={subject.code ?? ""} />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
