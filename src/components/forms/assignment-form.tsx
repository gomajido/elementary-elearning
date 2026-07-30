"use client";

import { useActionState, useEffect, useState } from "react";

import { createAssignmentAction, requestAssignmentAttachmentUploadUrlAction, type ActionState } from "@/server/controllers/assignment-controller";
import { FileUploadField } from "@/components/forms/file-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_ATTACHMENT_BYTES } from "@/lib/uploads";

const initialState: ActionState = {};

export function AssignmentForm({
  courseId,
  themeId,
  onSuccess,
}: {
  courseId: string;
  themeId: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createAssignmentAction, initialState);
  const [attachmentR2Key, setAttachmentR2Key] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="themeId" value={themeId} />
      {attachmentR2Key && <input type="hidden" name="attachmentR2Key" value={attachmentR2Key} />}
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="instructions">Instruksi (opsional)</Label>
        <Textarea id="instructions" name="instructions" rows={3} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dueDate">Tenggat waktu</Label>
        <Input id="dueDate" name="dueDate" type="date" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="maxScore">Nilai maksimal</Label>
        <Input id="maxScore" name="maxScore" type="number" min={1} required />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allowLateSubmission" defaultChecked />
        Izinkan pengumpulan terlambat
      </label>
      <div className="sm:col-span-2">
        <FileUploadField
          label="Lampiran (opsional, PDF/gambar/Word, maks 25MB)"
          accept="application/pdf,image/*,.doc,.docx"
          maxBytes={MAX_ATTACHMENT_BYTES}
          requestUploadUrl={(contentType) => requestAssignmentAttachmentUploadUrlAction(courseId, contentType)}
          onUploaded={(key) => setAttachmentR2Key(key)}
        />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Membuat…" : "Buat tugas"}
      </Button>
    </form>
  );
}
