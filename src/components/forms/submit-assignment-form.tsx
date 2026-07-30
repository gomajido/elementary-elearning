"use client";

import { useActionState, useState } from "react";

import { submitAssignmentAction, requestSubmissionAttachmentUploadUrlAction, type ActionState } from "@/server/controllers/assignment-controller";
import { FileUploadField } from "@/components/forms/file-upload-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_ATTACHMENT_BYTES } from "@/lib/uploads";

const initialState: ActionState = {};

export function SubmitAssignmentForm({ assignmentId, defaultText }: { assignmentId: string; defaultText?: string }) {
  const [state, formAction, pending] = useActionState(submitAssignmentAction, initialState);
  const [attachmentR2Key, setAttachmentR2Key] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      {attachmentR2Key && <input type="hidden" name="attachmentR2Key" value={attachmentR2Key} />}
      <Textarea name="textResponse" rows={5} defaultValue={defaultText} placeholder="Tulis jawabanmu di sini…" required />
      <FileUploadField
        label="Lampiran (opsional, PDF/gambar/Word, maks 25MB)"
        accept="application/pdf,image/*,.doc,.docx"
        maxBytes={MAX_ATTACHMENT_BYTES}
        requestUploadUrl={(contentType) => requestSubmissionAttachmentUploadUrlAction(assignmentId, contentType)}
        onUploaded={(key) => setAttachmentR2Key(key)}
      />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-fit">
        {pending ? "Mengirim…" : "Kirim"}
      </Button>
    </form>
  );
}
