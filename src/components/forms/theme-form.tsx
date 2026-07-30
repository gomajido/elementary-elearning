"use client";

import { useActionState, useEffect } from "react";

import { createThemeAction, type ActionState } from "@/server/controllers/course-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function ThemeForm({ courseId, onSuccess }: { courseId: string; onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(createThemeAction, initialState);

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="theme-title">Judul Bab</Label>
        <Input id="theme-title" name="title" placeholder="Bab 1" required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menambahkan…" : "Tambah Bab"}
      </Button>
    </form>
  );
}
