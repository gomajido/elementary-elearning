"use client";

import { useActionState, useEffect } from "react";

import { adminUpdateAccountAction, type UpdateAccountState } from "@/server/controllers/account-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UpdateAccountState = {};

export function EditAccountForm({
  account,
  onSuccess,
}: {
  account: { id: string; email: string | null; username: string | null };
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(adminUpdateAccountAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="userId" value={account.id} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={account.email ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={account.username ?? ""} minLength={3} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600 dark:text-green-500">Perubahan disimpan.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
