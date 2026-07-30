import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintButton } from "@/components/report-card/print-button";
import type { GradeService } from "@/server/services/grade-service";

type ReportCardData = Awaited<ReturnType<typeof GradeService.reportCardForStudent>>;

function formatPct(pct: number | null) {
  return pct === null ? "—" : `${pct.toFixed(1)}%`;
}

export function ReportCard({ student, classRow, academicYear, subjects }: ReportCardData) {
  if (!student) return <p className="text-muted-foreground">Siswa tidak ditemukan.</p>;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rapor</h1>
        <PrintButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {student.firstName} {student.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>Kelas: {classRow ? `${classRow.name}${classRow.section ? ` ${classRow.section}` : ""}` : "—"}</p>
          <p>Tahun Ajaran: {academicYear?.name ?? "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nilai per Mata Pelajaran</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-muted-foreground">Belum ada nilai untuk tahun ajaran ini.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Rata-rata Tugas</TableHead>
                  <TableHead>Rata-rata Kuis</TableHead>
                  <TableHead>Rata-rata Keseluruhan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s.subjectId}>
                    <TableCell className="font-medium">{s.subjectName}</TableCell>
                    <TableCell>{formatPct(s.assignmentAvgPct)}</TableCell>
                    <TableCell>{formatPct(s.quizAvgPct)}</TableCell>
                    <TableCell>{formatPct(s.overallAvgPct)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
