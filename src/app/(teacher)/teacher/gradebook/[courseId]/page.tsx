import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { GradeService } from "@/server/services/grade-service";
import { CourseService } from "@/server/services/course-service";
import { GradebookTable } from "@/components/tables/gradebook-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <GradebookTable rows={rows} />
      </CardContent>
    </Card>
  );
}
