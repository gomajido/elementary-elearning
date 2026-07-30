import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService, CourseError } from "@/server/services/course-service";
import { GradeService } from "@/server/services/grade-service";
import { ReportCard } from "@/components/report-card/report-card";

export default async function TeacherReportCardPage({ params }: { params: Promise<{ studentId: string }> }) {
  const user = await requireRole(["teacher"]);
  const { studentId } = await params;

  try {
    await CourseService.assertTeacherCanViewStudent(user.id, studentId);
  } catch (err) {
    if (err instanceof CourseError) notFound();
    throw err;
  }

  const reportCard = await GradeService.reportCardForStudent(studentId);
  return <ReportCard {...reportCard} />;
}
