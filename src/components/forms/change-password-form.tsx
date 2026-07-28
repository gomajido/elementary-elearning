"use client";

import { useActionState } from "react";

import { changePasswordAction, type ChangePasswordState } from "@/server/controllers/auth-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Kata sandi saat ini</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Kata sandi baru</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Menyimpan…" : "Simpan kata sandi baru"}
      </Button>
    </form>
  );
}
