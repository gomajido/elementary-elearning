import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { GradeService } from "@/server/services/grade-service";
import { CourseService } from "@/server/services/course-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TeacherGradebookPage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireRole(["teacher"]);
  const { courseId } = await params;

  const detail = await CourseService.courseDetail(courseId);
  if (!detail) notFound();
  const rows = await GradeService.gradebookForCourse(courseId);

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Buku Nilai — {detail.course.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Tugas</TableHead>
              <TableHead>Kuis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.student.id}>
                <TableCell>
                  {row.student.firstName} {row.student.lastName}
                </TableCell>
                <TableCell>
                  {row.assignmentMax > 0 ? `${row.assignmentTotal} / ${row.assignmentMax}` : "—"}
                </TableCell>
                <TableCell>{row.quizMax > 0 ? `${row.quizTotal} / ${row.quizMax}` : "—"}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
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
