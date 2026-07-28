"use client";

import { useActionState } from "react";

import { grantPortalAccessAction, type GrantAccessState } from "@/server/controllers/guardian-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: GrantAccessState = {};

export function GrantGuardianAccessForm({ guardianId, defaultEmail }: { guardianId: string; defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState(grantPortalAccessAction, initialState);

  if (state.tempPassword) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs dark:border-amber-900 dark:bg-amber-950">
        <p className="font-medium">Temp password: <code className="rounded bg-background px-1">{state.tempPassword}</code></p>
        <p className="text-muted-foreground">Share now — shown once.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="guardianId" value={guardianId} />
      <Input name="email" type="email" placeholder="parent@email.com" defaultValue={defaultEmail} className="h-7 w-48 text-xs" required />
      <Button type="submit" disabled={pending} size="sm" variant="outline">
        {pending ? "…" : "Grant access"}
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
