"use client";

import { useActionState } from "react";

import { grantStudentPortalAccessAction, type GrantStudentAccessState } from "@/server/controllers/student-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: GrantStudentAccessState = {};

export function GrantStudentAccessForm({ studentId }: { studentId: string }) {
  const [state, formAction, pending] = useActionState(grantStudentPortalAccessAction, initialState);

  if (state.tempPassword) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs dark:border-amber-900 dark:bg-amber-950">
        <p className="font-medium">
          Kata sandi sementara: <code className="rounded bg-background px-1">{state.tempPassword}</code>
        </p>
        <p className="text-muted-foreground">Bagikan sekarang — hanya ditampilkan sekali.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="studentId" value={studentId} />
      <Input name="email" type="email" placeholder="siswa@email.com" className="h-7 w-44 text-xs" required />
      <Button type="submit" disabled={pending} size="sm" variant="outline">
        {pending ? "…" : "Beri akses"}
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
