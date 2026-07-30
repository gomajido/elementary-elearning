"use client";

import { EditTeacherForm } from "@/components/forms/edit-teacher-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EditTeacherDialog({
  teacher,
  photoStorageKey,
  photoUpdatedAt,
  open,
  onOpenChange,
}: {
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    phone: string | null;
    hireDate: string | null;
  };
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit guru — {teacher.firstName} {teacher.lastName}
          </DialogTitle>
        </DialogHeader>
        <EditTeacherForm teacher={teacher} photoStorageKey={photoStorageKey} photoUpdatedAt={photoUpdatedAt} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
