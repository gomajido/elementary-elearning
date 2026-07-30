import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { GradeService } from "@/server/services/grade-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { ReportCard } from "@/components/report-card/report-card";

export default async function StudentReportCardPage() {
  const user = await requireRole(["student"]);
  const student = await StudentRepository.findByUserId(user.id);
  if (!student) notFound();

  const reportCard = await GradeService.reportCardForStudent(student.id);
  return <ReportCard {...reportCard} />;
}
