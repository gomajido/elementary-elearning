import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService, GuardianPortalError } from "@/server/services/guardian-service";
import { AttendanceService } from "@/server/services/attendance-service";
import { FeeService } from "@/server/services/fee-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_VARIANT = { paid: "secondary", partial: "outline", unpaid: "destructive" } as const;

export default async function ChildDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const user = await requireRole(["parent"]);
  const { studentId } = await params;

  try {
    await GuardianService.assertGuardianOwnsStudent(user.id, studentId);
  } catch (err) {
    if (err instanceof GuardianPortalError) notFound();
    throw err;
  }

  const [student, attendance, invoices] = await Promise.all([
    StudentRepository.findById(studentId),
    AttendanceService.historyForStudent(studentId),
    FeeService.invoicesForStudent(studentId),
  ]);
  if (!student) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {student.firstName} {student.lastName}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell className="capitalize">{record.status}</TableCell>
                  <TableCell>{record.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No attendance recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(({ invoice, balanceCents, status }) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{formatCents(invoice.totalAmountCents)}</TableCell>
                  <TableCell>{formatCents(balanceCents)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No invoices yet
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
