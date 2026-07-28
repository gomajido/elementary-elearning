import Link from "next/link";

import { FeeService } from "@/server/services/fee-service";
import { AcademicService } from "@/server/services/academic-service";
import { StudentService } from "@/server/services/student-service";
import { InvoiceGenerateForm } from "@/components/forms/invoice-generate-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, label } from "@/lib/labels";

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

const STATUS_VARIANT = { paid: "secondary", partial: "outline", unpaid: "destructive" } as const;

export default async function InvoicesPage() {
  const [invoices, students, classes, academicYears, feeStructures] = await Promise.all([
    FeeService.allInvoicesWithSummary(),
    StudentService.listStudents(),
    AcademicService.listClasses(),
    AcademicService.listAcademicYears(),
    FeeService.listFeeStructures(),
  ]);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat tagihan</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceGenerateForm
            students={students}
            classes={classes}
            academicYears={academicYears}
            feeStructures={feeStructures}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tagihan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Tagihan</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Sisa Tagihan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(({ invoice, student, balanceCents, status }) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link href={`/admin/fees/invoices/${invoice.id}`} className="underline underline-offset-4">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{formatCents(invoice.totalAmountCents)}</TableCell>
                  <TableCell>{formatCents(balanceCents)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[status]}>{label(INVOICE_STATUS_LABELS, status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada tagihan
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
