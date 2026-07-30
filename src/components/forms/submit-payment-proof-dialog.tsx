"use client";

import { useState } from "react";

import { SubmitPaymentProofForm } from "@/components/forms/submit-payment-proof-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SubmitPaymentProofDialog({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Upload bukti transfer</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload bukti transfer — {invoiceNumber}</DialogTitle>
        </DialogHeader>
        <SubmitPaymentProofForm invoiceId={invoiceId} />
      </DialogContent>
    </Dialog>
  );
}
