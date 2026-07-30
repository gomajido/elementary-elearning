"use client";

import { useActionState, useEffect } from "react";

import { updateContentItemAction, type ActionState } from "@/server/controllers/course-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContentItemType } from "@/lib/db/schema";

const initialState: ActionState = {};

/**
 * Type is fixed after creation — changing a PDF into a note would leave the
 * uploaded object orphaned and the new type's field empty. Delete and re-add
 * instead.
 */
export function EditContentItemForm({
  item,
  onSuccess,
}: {
  item: {
    id: string;
    title: string;
    type: ContentItemType;
    bodyMarkdown: string | null;
    externalUrl: string | null;
  };
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateContentItemAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="contentItemId" value={item.id} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-content-title">Judul</Label>
        <Input id="edit-content-title" name="title" defaultValue={item.title} required />
      </div>
      {item.type === "note" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-content-body">Isi</Label>
          <Textarea id="edit-content-body" name="bodyMarkdown" rows={4} defaultValue={item.bodyMarkdown ?? ""} required />
        </div>
      )}
      {(item.type === "link" || item.type === "video") && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-content-url">{item.type === "video" ? "URL YouTube" : "URL"}</Label>
          <Input
            id="edit-content-url"
            name="externalUrl"
            type="url"
            defaultValue={item.externalUrl ?? ""}
            required
          />
        </div>
      )}
      {item.type === "pdf" && (
        <p className="text-sm text-muted-foreground">
          File PDF tidak bisa diganti di sini — hapus materi ini lalu unggah yang baru.
        </p>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
