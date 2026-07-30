"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

import { EditPaymentDialog } from "@/components/tables/edit-payment-dialog";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PaymentMethod } from "@/lib/db/schema";

export function PaymentRowActions({
  payment,
  invoiceId,
  onDelete,
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
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Aksi untuk pembayaran {payment.receiptNumber}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit min-w-0 [&_[data-slot=dropdown-menu-item]]:text-xs [&_[data-slot=dropdown-menu-item]]:whitespace-nowrap">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit pembayaran
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPaymentDialog payment={payment} invoiceId={invoiceId} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteEntityDialog
        name={`pembayaran ${payment.receiptNumber}`}
        onDelete={onDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
