import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService, CourseError } from "@/server/services/course-service";
import { AssignmentService } from "@/server/services/assignment-service";
import { QuizService } from "@/server/services/quiz-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { startAttemptAction } from "@/server/controllers/quiz-controller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function StudentCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await requireRole(["student"]);
  const { courseId } = await params;

  const student = await StudentRepository.findByUserId(user.id);
  if (!student) notFound();

  try {
    await CourseService.assertStudentCanViewCourse(student.id, courseId);
  } catch (err) {
    if (err instanceof CourseError) notFound();
    throw err;
  }

  const detail = await CourseService.courseDetail(courseId);
  if (!detail) notFound();
  const assignments = await AssignmentService.listForCourse(courseId);
  const quizzes = await QuizService.publishedQuizzesForStudent(courseId, student.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{detail.course.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {detail.contentItems.map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <p className="text-base font-medium">{item.title}</p>
              {item.bodyMarkdown && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.bodyMarkdown}</p>}
              {item.externalUrl && (
                <a href={item.externalUrl} target="_blank" rel="noreferrer" className="mt-1 block underline underline-offset-4">
                  Open link
                </a>
              )}
            </div>
          ))}
          {detail.contentItems.length === 0 && <p className="text-muted-foreground">Nothing here yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {assignments.map((a) => (
            <Link key={a.id} href={`/student/assignments/${a.id}`} className="rounded-lg border p-4 hover:bg-muted">
              <p className="text-base font-medium">{a.title}</p>
              <p className="text-sm text-muted-foreground">Due {a.dueDate}</p>
            </Link>
          ))}
          {assignments.length === 0 && <p className="text-muted-foreground">No assignments yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quizzes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {quizzes.map(({ quiz, attemptsRemaining }) => (
            <div key={quiz.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-base font-medium">{quiz.title}</p>
                <p className="text-sm text-muted-foreground">
                  {attemptsRemaining > 0 ? `${attemptsRemaining} attempt(s) left` : "No attempts left"}
                </p>
              </div>
              {attemptsRemaining > 0 && (
                <form action={startAttemptAction.bind(null, quiz.id)}>
                  <Button type="submit">Start quiz</Button>
                </form>
              )}
            </div>
          ))}
          {quizzes.length === 0 && <p className="text-muted-foreground">No quizzes yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
