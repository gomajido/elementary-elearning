import { requireRole } from "@/lib/auth/rbac";
import { GradeService } from "@/server/services/grade-service";
import { ReportCard } from "@/components/report-card/report-card";

export default async function AdminReportCardPage({ params }: { params: Promise<{ studentId: string }> }) {
  await requireRole(["admin"]);
  const { studentId } = await params;

  const reportCard = await GradeService.reportCardForStudent(studentId);
  return <ReportCard {...reportCard} />;
}
