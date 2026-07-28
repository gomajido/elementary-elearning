import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService, GuardianPortalError } from "@/server/services/guardian-service";
import { AttendanceService } from "@/server/services/attendance-service";
import { FeeService } from "@/server/services/fee-service";
import { GradeService } from "@/server/services/grade-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ATTENDANCE_STATUS_LABELS, INVOICE_STATUS_LABELS, label } from "@/lib/labels";

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
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

  const [student, attendance, invoices, grades] = await Promise.all([
    StudentRepository.findById(studentId),
    AttendanceService.historyForStudent(studentId),
    FeeService.invoicesForStudent(studentId),
    GradeService.gradesForStudent(studentId),
  ]);
  if (!student) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {student.firstName} {student.lastName}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Nilai</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[...grades.assignments.map((a) => ({ ...a, kind: "Tugas" })), ...grades.quizzes.map((q) => ({ ...q, kind: "Kuis" }))].map(
            (item, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  {item.title} <span className="text-muted-foreground">({item.kind} — {item.courseTitle})</span>
                </span>
                <span>{item.score !== null ? `${item.score} / ${item.maxScore}` : "Belum dinilai"}</span>
              </div>
            )
          )}
          {grades.assignments.length === 0 && grades.quizzes.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada nilai</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{label(ATTENDANCE_STATUS_LABELS, record.status)}</TableCell>
                  <TableCell>{record.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Belum ada catatan kehadiran
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Biaya</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Tagihan</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Sisa Tagihan</TableHead>
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
                    <Badge variant={STATUS_VARIANT[status]}>{label(INVOICE_STATUS_LABELS, status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
