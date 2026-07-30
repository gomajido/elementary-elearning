"use client";

import { GrantStudentAccessForm } from "@/components/forms/grant-student-access-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function GrantStudentAccessDialog({
  studentId,
  name,
  open,
  onOpenChange,
}: {
  studentId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Kelola akses portal — {name}</DialogTitle>
        </DialogHeader>
        <GrantStudentAccessForm studentId={studentId} />
      </DialogContent>
    </Dialog>
  );
}
