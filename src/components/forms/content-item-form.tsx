"use client";

import { useActionState, useEffect, useState } from "react";

import { addContentItemAction, requestContentFileUploadUrlAction, type ActionState } from "@/server/controllers/course-controller";
import { FileUploadField } from "@/components/forms/file-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_ATTACHMENT_BYTES } from "@/lib/uploads";

const initialState: ActionState = {};

export function ContentItemForm({
  courseId,
  themeId,
  onSuccess,
}: {
  courseId: string;
  themeId: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(addContentItemAction, initialState);
  const [type, setType] = useState<"note" | "link" | "video" | "pdf">("note");
  const [r2Key, setR2Key] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="themeId" value={themeId} />
      {r2Key && <input type="hidden" name="r2Key" value={r2Key} />}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="type" value="note" checked={type === "note"} onChange={() => setType("note")} />
          Catatan
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="type" value="link" checked={type === "link"} onChange={() => setType("link")} />
          Tautan
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="type" value="video" checked={type === "video"} onChange={() => setType("video")} />
          Video
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="type" value="pdf" checked={type === "pdf"} onChange={() => setType("pdf")} />
          PDF
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" required />
      </div>
      {type === "note" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="bodyMarkdown">Isi</Label>
          <Textarea id="bodyMarkdown" name="bodyMarkdown" rows={4} required />
        </div>
      )}
      {type === "link" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="externalUrl">URL</Label>
          <Input id="externalUrl" name="externalUrl" type="url" placeholder="https://…" required />
        </div>
      )}
      {type === "video" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="externalUrl">URL YouTube</Label>
          <Input id="externalUrl" name="externalUrl" type="url" placeholder="https://youtube.com/watch?v=…" required />
        </div>
      )}
      {type === "pdf" && (
        <FileUploadField
          label="File PDF"
          accept="application/pdf"
          maxBytes={MAX_ATTACHMENT_BYTES}
          requestUploadUrl={(contentType) => requestContentFileUploadUrlAction(courseId, contentType)}
          onUploaded={(key) => setR2Key(key)}
        />
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending || (type === "pdf" && !r2Key)} className="w-fit">
        {pending ? "Menambahkan…" : "Tambah materi"}
      </Button>
    </form>
  );
}
