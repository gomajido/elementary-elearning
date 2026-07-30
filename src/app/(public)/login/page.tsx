"use client";

import { useActionState } from "react";
import Image from "next/image";

import { loginAction, type LoginState } from "@/server/controllers/auth-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "@/app/logo.png";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-foreground/10">
            <Image src={logo} alt="Madani Islamic School" className="h-full w-full object-contain" />
          </div>
          <CardTitle>Masuk</CardTitle>
          <CardDescription>Gunakan email/NIP/username dan kata sandi yang diberikan oleh pihak sekolah.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email, NIP, atau Username</Label>
              <Input id="email" name="email" type="text" autoComplete="username" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Sedang masuk…" : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
