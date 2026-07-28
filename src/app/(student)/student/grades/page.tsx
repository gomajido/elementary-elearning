import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { GradeService } from "@/server/services/grade-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentGradesPage() {
  const user = await requireRole(["student"]);
  const student = await StudentRepository.findByUserId(user.id);
  if (!student) notFound();

  const { assignments, quizzes } = await GradeService.gradesForStudent(student.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">My Grades</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {assignments.map((a, i) => (
            <div key={i} className="rounded-lg border p-4">
              <p className="text-base font-medium">
                {a.title} <span className="text-sm font-normal text-muted-foreground">— {a.courseTitle}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {a.score !== null ? `${a.score} / ${a.maxScore}` : "Not graded yet"}
              </p>
            </div>
          ))}
          {assignments.length === 0 && <p className="text-muted-foreground">No graded assignments yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quizzes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {quizzes.map((q, i) => (
            <div key={i} className="rounded-lg border p-4">
              <p className="text-base font-medium">
                {q.title} <span className="text-sm font-normal text-muted-foreground">— {q.courseTitle}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {q.score} / {q.maxScore}
              </p>
            </div>
          ))}
          {quizzes.length === 0 && <p className="text-muted-foreground">No completed quizzes yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
