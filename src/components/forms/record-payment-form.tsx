"use client";

import { useActionState } from "react";

import { recordPaymentAction, type ActionState } from "@/server/controllers/fee-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/lib/db/schema";

const initialState: ActionState = {};

export function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState(recordPaymentAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Method</Label>
        <Select
          name="method"
          required
          items={Object.fromEntries(PAYMENT_METHODS.map((m) => [m, m.replace("_", " ")]))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="paidAt">Date paid</Label>
        <Input id="paidAt" name="paidAt" type="date" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="referenceNumber">Reference # (optional)</Label>
        <Input id="referenceNumber" name="referenceNumber" placeholder="Bank transfer ref" />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:w-fit">
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}
