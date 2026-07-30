"use client";

import { GrantGuardianAccessForm } from "@/components/forms/grant-guardian-access-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function GrantGuardianAccessDialog({
  guardianId,
  defaultEmail,
  name,
  open,
  onOpenChange,
}: {
  guardianId: string;
  defaultEmail?: string;
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
        <GrantGuardianAccessForm guardianId={guardianId} defaultEmail={defaultEmail} />
      </DialogContent>
    </Dialog>
  );
}
