"use client";

import { useActionState, useEffect } from "react";

import { renameThemeAction, type ActionState } from "@/server/controllers/course-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function EditThemeForm({
  theme,
  onSuccess,
}: {
  theme: { id: string; title: string };
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(renameThemeAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="themeId" value={theme.id} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-theme-title">Judul Bab</Label>
        <Input id="edit-theme-title" name="title" defaultValue={theme.title} required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
