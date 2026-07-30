"use client";

import { EditFeeStructureForm } from "@/components/forms/edit-fee-structure-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FeeFrequency } from "@/lib/db/schema";

export function EditFeeStructureDialog({
  structure,
  academicYears,
  open,
  onOpenChange,
}: {
  structure: {
    id: string;
    name: string;
    amountCents: number;
    frequency: FeeFrequency;
    academicYearId: string;
    gradeLevel: number | null;
  };
  academicYears: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit biaya — {structure.name}</DialogTitle>
        </DialogHeader>
        <EditFeeStructureForm structure={structure} academicYears={academicYears} />
      </DialogContent>
    </Dialog>
  );
}
