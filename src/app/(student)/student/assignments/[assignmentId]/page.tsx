import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { AssignmentService } from "@/server/services/assignment-service";
import { CourseService, CourseError } from "@/server/services/course-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { SubmitAssignmentForm } from "@/components/forms/submit-assignment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { presignDownload } from "@/lib/storage/client";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const user = await requireRole(["student"]);
  const { assignmentId } = await params;

  const student = await StudentRepository.findByUserId(user.id);
  if (!student) notFound();

  const detail = await AssignmentService.assignmentDetail(assignmentId);
  if (!detail?.course) notFound();

  try {
    await CourseService.assertStudentCanViewCourse(student.id, detail.course.id);
  } catch (err) {
    if (err instanceof CourseError) notFound();
    throw err;
  }

  const submission = await AssignmentService.submissionForStudent(assignmentId, student.id);
  const assignmentAttachmentUrl = detail.assignment.attachmentR2Key
    ? await presignDownload(detail.assignment.attachmentR2Key)
    : null;
  const submissionAttachmentUrl = submission?.attachmentR2Key
    ? await presignDownload(submission.attachmentR2Key)
    : null;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl">{detail.assignment.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tenggat {detail.assignment.dueDate} · {detail.assignment.maxScore} poin
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {detail.assignment.instructions && <p className="whitespace-pre-wrap">{detail.assignment.instructions}</p>}
        {assignmentAttachmentUrl && (
          <a href={assignmentAttachmentUrl} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
            Lihat lampiran tugas
          </a>
        )}

        {submission?.status === "graded" ? (
          <div className="rounded-lg border p-4">
            <Badge variant="secondary">Dinilai</Badge>
            <p className="mt-2 text-lg font-medium">
              Nilai: {submission.score} / {detail.assignment.maxScore}
            </p>
            {submission.feedback && <p className="mt-1 text-muted-foreground">{submission.feedback}</p>}
            {submissionAttachmentUrl && (
              <a href={submissionAttachmentUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm underline underline-offset-4">
                Lihat lampiranmu
              </a>
            )}
          </div>
        ) : (
          <>
            {submission && (
              <p className="text-sm text-muted-foreground">
                Sudah dikumpulkan {submission.status === "late" ? "(terlambat)" : ""} — kamu bisa kumpulkan ulang di bawah.
                {submissionAttachmentUrl && (
                  <>
                    {" "}
                    <a href={submissionAttachmentUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                      Lihat lampiranmu
                    </a>
                  </>
                )}
              </p>
            )}
            <SubmitAssignmentForm assignmentId={assignmentId} defaultText={submission?.textResponse ?? undefined} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
