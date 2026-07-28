import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { AssignmentService } from "@/server/services/assignment-service";
import { GradeSubmissionForm } from "@/components/forms/grade-submission-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
          {detail.assignment.title} — due {detail.assignment.dueDate} — {detail.assignment.maxScore} pts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map(({ submission, student }) => (
              <TableRow key={submission.id}>
                <TableCell>
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>
                  <Badge variant={submission.status === "graded" ? "secondary" : "outline"}>{submission.status}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{submission.textResponse ?? "—"}</TableCell>
                <TableCell>{submission.score ?? "—"}</TableCell>
                <TableCell>
                  <GradeSubmissionForm submissionId={submission.id} maxScore={detail.assignment.maxScore} />
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No submissions yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
