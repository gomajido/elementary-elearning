"use client";

import { EditAccountForm } from "@/components/forms/edit-account-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EditAccountDialog({
  account,
  name,
  open,
  onOpenChange,
}: {
  account: { id: string; email: string | null; username: string | null };
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ubah email/username — {name}</DialogTitle>
        </DialogHeader>
        <EditAccountForm account={account} />
      </DialogContent>
    </Dialog>
  );
}
