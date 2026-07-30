"use client";

import { EditClassForm } from "@/components/forms/edit-class-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EditClassDialog({
  classRow,
  academicYears,
  teachers,
  photoStorageKey,
  photoUpdatedAt,
  open,
  onOpenChange,
}: {
  classRow: {
    id: string;
    name: string;
    section: string | null;
    gradeLevel: number;
    academicYearId: string;
    classTeacherId: string | null;
    capacity: number | null;
  };
  academicYears: { id: string; name: string }[];
  teachers: { id: string; firstName: string; lastName: string }[];
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit kelas — {classRow.name}</DialogTitle>
        </DialogHeader>
        <EditClassForm
          classRow={classRow}
          academicYears={academicYears}
          teachers={teachers}
          photoStorageKey={photoStorageKey}
          photoUpdatedAt={photoUpdatedAt}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
