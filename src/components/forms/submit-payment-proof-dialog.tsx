"use client";

import { useState } from "react";

import { SubmitPaymentProofForm } from "@/components/forms/submit-payment-proof-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** `onSubmitted` lets the caller refetch its invoice list after a claim is filed — see submit-payment-proof-form.tsx. */
export function SubmitPaymentProofDialog({
  invoiceId,
  invoiceNumber,
  onSubmitted,
}: {
  invoiceId: string;
  invoiceNumber: string;
  onSubmitted?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Upload bukti transfer</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload bukti transfer — {invoiceNumber}</DialogTitle>
        </DialogHeader>
        {/* Only rendered while open, so each open is a fresh form — no stale fields/proof left over from a prior submission. */}
        {open && (
          <SubmitPaymentProofForm
            invoiceId={invoiceId}
            onSuccess={() => {
              setOpen(false);
              onSubmitted?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
