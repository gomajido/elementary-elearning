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
          <CardTitle>Add class</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm academicYears={academicYears} teachers={teachers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead>Class teacher</TableHead>
                <TableHead>Capacity</TableHead>
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
                    No classes yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign teacher to class/subject</CardTitle>
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
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
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
                    No assignments yet
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
