"use client";

import { EditAcademicYearForm } from "@/components/forms/edit-academic-year-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EditAcademicYearDialog({
  year,
  open,
  onOpenChange,
}: {
  year: { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit tahun ajaran — {year.name}</DialogTitle>
        </DialogHeader>
        <EditAcademicYearForm year={year} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
