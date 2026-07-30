"use client";

import { EditPaymentForm } from "@/components/forms/edit-payment-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PaymentMethod } from "@/lib/db/schema";

export function EditPaymentDialog({
  payment,
  invoiceId,
  open,
  onOpenChange,
}: {
  payment: {
    id: string;
    receiptNumber: string;
    amountCents: number;
    method: PaymentMethod;
    referenceNumber: string | null;
    paidAt: string;
    notes: string | null;
    isVerified: boolean;
    proofStorageKey: string | null;
  };
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit pembayaran — {payment.receiptNumber}</DialogTitle>
        </DialogHeader>
        <EditPaymentForm payment={payment} invoiceId={invoiceId} />
      </DialogContent>
    </Dialog>
  );
}
