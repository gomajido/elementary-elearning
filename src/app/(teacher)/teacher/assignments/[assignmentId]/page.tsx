import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { AssignmentService } from "@/server/services/assignment-service";
import { SubmissionsTable } from "@/components/tables/submissions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeacherAssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  await requireRole(["teacher"]);
  const { assignmentId } = await params;

  const detail = await AssignmentService.assignmentDetail(assignmentId);
  if (!detail) notFound();
  const submissions = await AssignmentService.submissionsForAssignment(assignmentId);

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>
          {detail.assignment.title} — tenggat {detail.assignment.dueDate} — {detail.assignment.maxScore} poin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SubmissionsTable rows={submissions} maxScore={detail.assignment.maxScore} />
      </CardContent>
    </Card>
  );
}
