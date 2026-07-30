import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService, GuardianPortalError } from "@/server/services/guardian-service";
import { GradeService } from "@/server/services/grade-service";
import { ReportCard } from "@/components/report-card/report-card";

export default async function ParentReportCardPage({ params }: { params: Promise<{ studentId: string }> }) {
  const user = await requireRole(["parent"]);
  const { studentId } = await params;

  try {
    await GuardianService.assertGuardianOwnsStudent(user.id, studentId);
  } catch (err) {
    if (err instanceof GuardianPortalError) notFound();
    throw err;
  }

  const reportCard = await GradeService.reportCardForStudent(studentId);
  return <ReportCard {...reportCard} />;
}
