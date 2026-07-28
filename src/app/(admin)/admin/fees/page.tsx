import Link from "next/link";

import { FeeService } from "@/server/services/fee-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

export default async function FeesOverviewPage() {
  const outstanding = await FeeService.outstandingBalanceReport();
  const totalOutstandingCents = outstanding.reduce((sum, row) => sum + row.balanceCents, 0);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex gap-4 text-sm">
        <Link href="/admin/fees/structures" className="underline underline-offset-4">
          Katalog biaya
        </Link>
        <Link href="/admin/fees/invoices" className="underline underline-offset-4">
          Tagihan
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tunggakan — total {formatCents(totalOutstandingCents)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Tagihan</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Sisa Tagihan</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstanding.map(({ invoice, student, balanceCents }) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link href={`/admin/fees/invoices/${invoice.id}`} className="underline underline-offset-4">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{formatCents(balanceCents)}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                </TableRow>
              ))}
              {outstanding.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Tidak ada tunggakan
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
