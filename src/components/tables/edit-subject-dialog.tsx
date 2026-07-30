"use client";

import { EditSubjectForm } from "@/components/forms/edit-subject-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EditSubjectDialog({
  subject,
  open,
  onOpenChange,
}: {
  subject: { id: string; name: string; code: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit mata pelajaran — {subject.name}</DialogTitle>
        </DialogHeader>
        <EditSubjectForm subject={subject} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
