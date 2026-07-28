import { StudentService } from "@/server/services/student-service";
import { AcademicService } from "@/server/services/academic-service";
import { StudentForm } from "@/components/forms/student-form";
import { GrantStudentAccessForm } from "@/components/forms/grant-student-access-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
          <CardTitle>Register student</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm classes={classes} academicYears={academicYears} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Portal access</TableHead>
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
                  <TableCell>{row.student.enrollmentStatus}</TableCell>
                  <TableCell>
                    {row.student.userId ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <GrantStudentAccessForm studentId={row.student.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {studentRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No students yet
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
