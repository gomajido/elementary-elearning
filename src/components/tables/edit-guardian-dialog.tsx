"use client";

import { EditGuardianForm } from "@/components/forms/edit-guardian-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EditGuardianDialog({
  guardian,
  photoStorageKey,
  photoUpdatedAt,
  open,
  onOpenChange,
}: {
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    relationshipType: "mother" | "father" | "guardian" | "other";
    phone: string | null;
    email: string | null;
    address: string | null;
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
            Edit wali — {guardian.firstName} {guardian.lastName}
          </DialogTitle>
        </DialogHeader>
        <EditGuardianForm guardian={guardian} photoStorageKey={photoStorageKey} photoUpdatedAt={photoUpdatedAt} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
