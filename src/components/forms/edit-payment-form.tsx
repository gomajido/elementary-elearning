"use client";

import { useActionState } from "react";

import { updatePaymentAction, type ActionState } from "@/server/controllers/fee-controller";
import { contentObjectUrl } from "@/lib/storage/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/db/schema";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";

const initialState: ActionState = {};

export function EditPaymentForm({
  payment,
  invoiceId,
}: {
  payment: {
    id: string;
    amountCents: number;
    method: PaymentMethod;
    referenceNumber: string | null;
    paidAt: string;
    notes: string | null;
    isVerified: boolean;
    proofStorageKey: string | null;
  };
  invoiceId: string;
}) {
  const [state, formAction, pending] = useActionState(updatePaymentAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="paymentId" value={payment.id} />
      <input type="hidden" name="invoiceId" value={invoiceId} />

      {payment.proofStorageKey && (
        <a
          href={contentObjectUrl(payment.proofStorageKey)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline underline-offset-4"
        >
          Lihat bukti transfer
        </a>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Jumlah</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={payment.amountCents / 100}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Metode</Label>
          <Select
            key={payment.method}
            name="method"
            required
            defaultValue={payment.method}
            items={Object.fromEntries(PAYMENT_METHODS.map((m) => [m, PAYMENT_METHOD_LABELS[m]]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paidAt">Tanggal bayar</Label>
          <Input id="paidAt" name="paidAt" type="date" defaultValue={payment.paidAt} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="referenceNumber">No. Referensi (opsional)</Label>
          <Input id="referenceNumber" name="referenceNumber" defaultValue={payment.referenceNumber ?? ""} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="notes">Catatan (opsional)</Label>
          <Input id="notes" name="notes" defaultValue={payment.notes ?? ""} />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="isVerified"
            name="isVerified"
            type="checkbox"
            className="size-4"
            defaultChecked={payment.isVerified}
          />
          <Label htmlFor="isVerified" className="font-normal">
            Sudah diverifikasi
          </Label>
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
