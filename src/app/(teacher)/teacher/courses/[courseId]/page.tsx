import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService } from "@/server/services/course-service";
import { AssignmentService } from "@/server/services/assignment-service";
import { QuizService } from "@/server/services/quiz-service";
import { ContentItemForm } from "@/components/forms/content-item-form";
import { AssignmentForm } from "@/components/forms/assignment-form";
import { QuizForm } from "@/components/forms/quiz-form";
import { PublishCourseButton } from "@/components/forms/publish-course-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTENT_ITEM_TYPE_LABELS, label } from "@/lib/labels";

export default async function TeacherCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireRole(["teacher"]);
  const { courseId } = await params;

  const detail = await CourseService.courseDetail(courseId);
  if (!detail) notFound();
  const assignments = await AssignmentService.listForCourse(courseId);
  const quizzes = await QuizService.listForCourse(courseId);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{detail.course.title}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={detail.course.isPublished ? "secondary" : "outline"}>
            {detail.course.isPublished ? "Diterbitkan" : "Draf"}
          </Badge>
          <Link href={`/teacher/gradebook/${courseId}`} className="text-sm underline underline-offset-4">
            Buku Nilai
          </Link>
          <PublishCourseButton courseId={courseId} isPublished={detail.course.isPublished} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {detail.contentItems.map((item) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {item.title} <span className="text-muted-foreground">({label(CONTENT_ITEM_TYPE_LABELS, item.type)})</span>
              </p>
              {item.bodyMarkdown && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.bodyMarkdown}</p>}
              {item.externalUrl && (
                <a href={item.externalUrl} target="_blank" rel="noreferrer" className="mt-1 block underline underline-offset-4">
                  {item.externalUrl}
                </a>
              )}
            </div>
          ))}
          {detail.contentItems.length === 0 && <p className="text-sm text-muted-foreground">Belum ada materi</p>}
          <ContentItemForm courseId={courseId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tugas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/teacher/assignments/${a.id}`}
              className="rounded-md border p-3 text-sm hover:bg-muted"
            >
              {a.title} — tenggat {a.dueDate} — {a.maxScore} poin
            </Link>
          ))}
          {assignments.length === 0 && <p className="text-sm text-muted-foreground">Belum ada tugas</p>}
          <AssignmentForm courseId={courseId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kuis</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {quizzes.map((q) => (
            <Link key={q.id} href={`/teacher/quizzes/${q.id}`} className="rounded-md border p-3 text-sm hover:bg-muted">
              {q.title} — maks {q.maxAttempts} percobaan
            </Link>
          ))}
          {quizzes.length === 0 && <p className="text-sm text-muted-foreground">Belum ada kuis</p>}
          <QuizForm courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  );
}
