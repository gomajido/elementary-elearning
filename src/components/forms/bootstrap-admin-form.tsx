"use client";

import { useActionState } from "react";

import { bootstrapAdminAction, type BootstrapState } from "@/server/controllers/auth-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: BootstrapState = {};

export function BootstrapAdminForm() {
  const [state, formAction, pending] = useActionState(bootstrapAdminAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Admin email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creating…" : "Create admin account"}
      </Button>
    </form>
  );
}
