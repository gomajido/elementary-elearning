"use client";

import { useActionState, useState } from "react";

import { addContentItemAction, type ActionState } from "@/server/controllers/course-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

// Video/PDF upload needs the storage upload UI wired up (see RFC 0002 —
// S3-compatible client exists in lib/storage/client.ts but isn't hooked to
// any form yet) — only note/link are offered here, so nothing dead-ends.
export function ContentItemForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(addContentItemAction, initialState);
  const [type, setType] = useState<"note" | "link">("note");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="type" value="note" checked={type === "note"} onChange={() => setType("note")} />
          Catatan
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="type" value="link" checked={type === "link"} onChange={() => setType("link")} />
          Tautan
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" required />
      </div>
      {type === "note" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="bodyMarkdown">Isi</Label>
          <Textarea id="bodyMarkdown" name="bodyMarkdown" rows={4} required />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="externalUrl">URL</Label>
          <Input id="externalUrl" name="externalUrl" type="url" placeholder="https://…" required />
        </div>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menambahkan…" : "Tambah materi"}
      </Button>
    </form>
  );
}
