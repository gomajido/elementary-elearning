import { AttendanceService } from "@/server/services/attendance-service";
import { ClassRepository } from "@/server/repositories/academic-repository";
import { todayIsoDate } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ATTENDANCE_STATUS_LABELS, label } from "@/lib/labels";

export default async function AdminClassAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { classId } = await params;
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayIsoDate();

  const [classRow, roster] = await Promise.all([
    ClassRepository.findById(classId),
    AttendanceService.rosterForClassAndDate(classId, date),
  ]);

  const counts = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
  for (const row of roster) {
    if (row.record) counts[row.record.status]++;
    else counts.unmarked++;
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {classRow?.name}
          {classRow?.section ? ` ${classRow.section}` : ""} — {date}
        </CardTitle>
        <div className="flex gap-2 pt-2">
          <Badge variant="secondary">Hadir: {counts.present}</Badge>
          <Badge variant="secondary">Tidak Hadir: {counts.absent}</Badge>
          <Badge variant="secondary">Terlambat: {counts.late}</Badge>
          <Badge variant="secondary">Izin: {counts.excused}</Badge>
          {counts.unmarked > 0 && <Badge variant="outline">Belum diisi: {counts.unmarked}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.map(({ student, record }) => (
              <TableRow key={student.id}>
                <TableCell>
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>{record ? label(ATTENDANCE_STATUS_LABELS, record.status) : "—"}</TableCell>
                <TableCell>{record?.notes ?? "—"}</TableCell>
              </TableRow>
            ))}
            {roster.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Tidak ada siswa di kelas ini
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
