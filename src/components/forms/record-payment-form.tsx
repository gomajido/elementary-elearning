"use client";

import { useActionState, useRef, useState } from "react";

import { recordPaymentAction, requestAdminPaymentProofUploadAction, type ActionState } from "@/server/controllers/fee-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/lib/db/schema";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";

const initialState: ActionState = {};

export function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState(recordPaymentAction, initialState);
  const [proofKey, setProofKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { uploadUrl, key } = await requestAdminPaymentProofUploadAction(invoiceId, file.type);
      const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Unggah gagal");
      setProofKey(key);
    } catch {
      setUploadError("Gagal mengunggah bukti transfer");
      setProofKey(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="proofStorageKey" value={proofKey ?? ""} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Jumlah</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Metode</Label>
        <Select
          name="method"
          required
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
        <Input id="paidAt" name="paidAt" type="date" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="referenceNumber">No. Referensi (opsional)</Label>
        <Input id="referenceNumber" name="referenceNumber" placeholder="Ref transfer bank" />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Input id="notes" name="notes" />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-3">
        <Label htmlFor="proof">Bukti transfer (opsional — foto atau PDF)</Label>
        <input ref={inputRef} id="proof" type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
        {uploading && <p className="text-xs text-muted-foreground">Mengunggah…</p>}
        {proofKey && <p className="text-xs text-green-600 dark:text-green-500">Bukti terunggah ✓</p>}
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input id="isVerified" name="isVerified" type="checkbox" className="size-4" defaultChecked />
        <Label htmlFor="isVerified" className="font-normal">
          Sudah diverifikasi
        </Label>
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Menyimpan…" : "Catat pembayaran"}
      </Button>
    </form>
  );
}
