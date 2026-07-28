import { AcademicService } from "@/server/services/academic-service";
import { TeacherService } from "@/server/services/teacher-service";
import { ClassForm } from "@/components/forms/class-form";
import { TeacherAssignmentForm } from "@/components/forms/teacher-assignment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ClassesPage() {
  const [classRows, academicYears, teachers, subjects, assignmentRows] = await Promise.all([
    AcademicService.listClassesWithDetails(),
    AcademicService.listAcademicYears(),
    TeacherService.listTeachers(),
    AcademicService.listSubjects(),
    AcademicService.listAssignmentsWithDetails(),
  ]);
  const classes = await AcademicService.listClasses();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm academicYears={academicYears} teachers={teachers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kelas</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Tahun ajaran</TableHead>
                <TableHead>Wali kelas</TableHead>
                <TableHead>Kapasitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classRows.map((row) => (
                <TableRow key={row.class.id}>
                  <TableCell>
                    {row.class.name}
                    {row.class.section ? ` ${row.class.section}` : ""}
                  </TableCell>
                  <TableCell>{row.class.gradeLevel}</TableCell>
                  <TableCell>{row.academicYearName}</TableCell>
                  <TableCell>
                    {row.classTeacherFirstName ? `${row.classTeacherFirstName} ${row.classTeacherLastName}` : "—"}
                  </TableCell>
                  <TableCell>{row.class.capacity ?? "—"}</TableCell>
                </TableRow>
              ))}
              {classRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada kelas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tetapkan guru ke kelas/mata pelajaran</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherAssignmentForm
            teachers={teachers}
            classes={classes}
            subjects={subjects}
            academicYears={academicYears}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Penugasan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guru</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignmentRows.map((row) => (
                <TableRow key={row.assignment.id}>
                  <TableCell>
                    {row.teacherFirstName} {row.teacherLastName}
                  </TableCell>
                  <TableCell>
                    {row.className}
                    {row.classSection ? ` ${row.classSection}` : ""}
                  </TableCell>
                  <TableCell>{row.subjectName}</TableCell>
                </TableRow>
              ))}
              {assignmentRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Belum ada penugasan
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
