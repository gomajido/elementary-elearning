import { StudentService } from "@/server/services/student-service";
import { AcademicService } from "@/server/services/academic-service";
import { StudentForm } from "@/components/forms/student-form";
import { GrantStudentAccessForm } from "@/components/forms/grant-student-access-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ENROLLMENT_STATUS_LABELS, label } from "@/lib/labels";

export default async function StudentsPage() {
  const [studentRows, classes, academicYears] = await Promise.all([
    StudentService.listStudentsWithDetails(),
    AcademicService.listClasses(),
    AcademicService.listAcademicYears(),
  ]);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Daftarkan siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm classes={classes} academicYears={academicYears} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Induk</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Tgl Lahir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Akses Portal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentRows.map((row) => (
                <TableRow key={row.student.id}>
                  <TableCell>{row.student.admissionNumber}</TableCell>
                  <TableCell>
                    {row.student.firstName} {row.student.lastName}
                  </TableCell>
                  <TableCell>
                    {row.className ? `${row.className}${row.classSection ? ` ${row.classSection}` : ""}` : "—"}
                  </TableCell>
                  <TableCell>{row.student.dateOfBirth}</TableCell>
                  <TableCell>{label(ENROLLMENT_STATUS_LABELS, row.student.enrollmentStatus)}</TableCell>
                  <TableCell>
                    {row.student.userId ? (
                      <Badge variant="secondary">Aktif</Badge>
                    ) : (
                      <GrantStudentAccessForm studentId={row.student.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {studentRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada siswa
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
