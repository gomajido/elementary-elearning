import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { AssignmentService } from "@/server/services/assignment-service";
import { SubmissionsTable } from "@/components/tables/submissions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { presignDownload } from "@/lib/storage/client";

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
  const rows = await Promise.all(
    submissions.map(async (row) => ({
      ...row,
      attachmentDownloadUrl: row.submission.attachmentR2Key
        ? await presignDownload(row.submission.attachmentR2Key)
        : null,
    })),
  );
  const attachmentDownloadUrl = detail.assignment.attachmentR2Key
    ? await presignDownload(detail.assignment.attachmentR2Key)
    : null;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>
          {detail.assignment.title} — tenggat {detail.assignment.dueDate} — {detail.assignment.maxScore} poin
        </CardTitle>
        {attachmentDownloadUrl && (
          <a href={attachmentDownloadUrl} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
            Lihat lampiran tugas
          </a>
        )}
      </CardHeader>
      <CardContent>
        <SubmissionsTable rows={rows} maxScore={detail.assignment.maxScore} />
      </CardContent>
    </Card>
  );
}
