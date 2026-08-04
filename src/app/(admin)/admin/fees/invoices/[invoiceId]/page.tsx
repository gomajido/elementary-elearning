import { notFound } from "next/navigation";

import { FeeService } from "@/server/services/fee-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { RecordPaymentForm } from "@/components/forms/record-payment-form";
import { PaymentsTable } from "@/components/tables/payments-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, label } from "@/lib/labels";

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

const STATUS_VARIANT = { paid: "secondary", partial: "outline", unpaid: "destructive" } as const;

export default async function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const detail = await FeeService.invoiceDetail(invoiceId);
  if (!detail) notFound();

  const student = await StudentRepository.findById(detail.invoice.studentId);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {detail.invoice.invoiceNumber} — {student?.firstName} {student?.lastName}
          </CardTitle>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant={STATUS_VARIANT[detail.status]}>{label(INVOICE_STATUS_LABELS, detail.status)}</Badge>
            {detail.hasPendingVerification && <Badge variant="outline">Menunggu verifikasi</Badge>}
            <span className="text-sm text-muted-foreground">
              Terbit {detail.invoice.issueDate} · Jatuh tempo {detail.invoice.dueDate}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.lineItems.map((li) => (
                <TableRow key={li.id}>
                  <TableCell>{li.description}</TableCell>
                  <TableCell>{formatCents(li.amountCents)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="font-medium">{formatCents(detail.invoice.totalAmountCents)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Terbayar</TableCell>
                <TableCell>{formatCents(detail.paidCents)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Sisa Tagihan</TableCell>
                <TableCell className="font-medium">{formatCents(detail.balanceCents)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {detail.status !== "paid" && (
        <Card>
          <CardHeader>
            <CardTitle>Catat pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <RecordPaymentForm invoiceId={invoiceId} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentsTable rows={detail.payments} invoiceId={invoiceId} />
        </CardContent>
      </Card>
    </div>
  );
}
