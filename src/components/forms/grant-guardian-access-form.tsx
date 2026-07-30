"use client";

import { useActionState } from "react";

import { grantPortalAccessAction, type GrantAccessState } from "@/server/controllers/guardian-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: GrantAccessState = {};

export function GrantGuardianAccessForm({ guardianId, defaultEmail }: { guardianId: string; defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState(grantPortalAccessAction, initialState);

  if (state.tempPassword) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950">
        {state.username && (
          <p className="font-medium">
            Username: <code className="rounded bg-background px-1.5 py-0.5">{state.username}</code>
          </p>
        )}
        <p className="mt-1 font-medium">
          Kata sandi sementara: <code className="rounded bg-background px-1.5 py-0.5">{state.tempPassword}</code>
        </p>
        <p className="mt-1 text-muted-foreground">Bagikan sekarang — hanya ditampilkan sekali.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="guardianId" value={guardianId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email wali (opsional)</Label>
        <Input id="email" name="email" type="email" placeholder="orangtua@email.com" defaultValue={defaultEmail} />
        <p className="text-xs text-muted-foreground">
          Kosongkan jika wali tidak memiliki email — sistem akan membuat username otomatis.
        </p>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Memproses…" : "Beri akses"}
      </Button>
    </form>
  );
}
