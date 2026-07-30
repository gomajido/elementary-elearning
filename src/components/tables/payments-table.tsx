"use client";

import { deletePaymentAction } from "@/server/controllers/fee-controller";
import { PaymentRowActions } from "@/components/tables/payment-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABELS, label } from "@/lib/labels";
import type { PaymentMethod } from "@/lib/db/schema";

type Payment = {
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

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

export function PaymentsTable({ rows, invoiceId }: { rows: Payment[]; invoiceId: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. Kuitansi</TableHead>
          <TableHead>Jumlah</TableHead>
          <TableHead>Metode</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.receiptNumber}</TableCell>
            <TableCell>{formatCents(p.amountCents)}</TableCell>
            <TableCell>{label(PAYMENT_METHOD_LABELS, p.method)}</TableCell>
            <TableCell>{p.paidAt}</TableCell>
            <TableCell>
              {p.isVerified ? (
                <Badge variant="secondary">Terverifikasi</Badge>
              ) : (
                <Badge variant="outline">Menunggu verifikasi</Badge>
              )}
            </TableCell>
            <TableCell>
              <PaymentRowActions
                payment={p}
                invoiceId={invoiceId}
                onDelete={() => deletePaymentAction(p.id, invoiceId)}
              />
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              Belum ada pembayaran tercatat
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
