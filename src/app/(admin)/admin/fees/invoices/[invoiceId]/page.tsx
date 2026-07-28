import { notFound } from "next/navigation";

import { FeeService } from "@/server/services/fee-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { RecordPaymentForm } from "@/components/forms/record-payment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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
          <div className="flex gap-2 pt-2">
            <Badge variant={STATUS_VARIANT[detail.status]}>{detail.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Issued {detail.invoice.issueDate} · Due {detail.invoice.dueDate}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line item</TableHead>
                <TableHead>Amount</TableHead>
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
                <TableCell>Paid</TableCell>
                <TableCell>{formatCents(detail.paidCents)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Balance</TableCell>
                <TableCell className="font-medium">{formatCents(detail.balanceCents)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record payment</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordPaymentForm invoiceId={invoiceId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.receiptNumber}</TableCell>
                  <TableCell>{formatCents(p.amountCents)}</TableCell>
                  <TableCell className="capitalize">{p.method.replace("_", " ")}</TableCell>
                  <TableCell>{p.paidAt}</TableCell>
                </TableRow>
              ))}
              {detail.payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No payments recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
