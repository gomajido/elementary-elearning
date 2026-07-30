import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService } from "@/server/services/course-service";
import { AssignmentService } from "@/server/services/assignment-service";
import { QuizService } from "@/server/services/quiz-service";
import { ContentItemView } from "@/components/content-item-view";
import {
  AddThemeDialog,
  AddContentItemDialog,
  AddAssignmentDialog,
  AddQuizDialog,
} from "@/components/forms/add-to-theme-dialogs";
import { PublishCourseButton } from "@/components/forms/publish-course-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from "@/components/ui/accordion";
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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bab</h2>
        <AddThemeDialog courseId={courseId} />
      </div>

      {detail.themes.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada Bab — tambah Bab dulu sebelum menambah materi, tugas, atau kuis.</p>
      )}

      <Accordion multiple className="flex flex-col gap-3">
        {detail.themes.map((theme) => {
          const themeContentItems = detail.contentItems.filter((item) => item.themeId === theme.id);
          const themeAssignments = assignments.filter((a) => a.themeId === theme.id);
          const themeQuizzes = quizzes.filter((q) => q.themeId === theme.id);

          return (
            <AccordionItem key={theme.id} value={theme.id}>
              <AccordionTrigger>{theme.title}</AccordionTrigger>
              <AccordionPanel>
                <Tabs defaultValue="materi">
                  <TabsList>
                    <TabsTab value="materi">Materi ({themeContentItems.length})</TabsTab>
                    <TabsTab value="tugas">Tugas ({themeAssignments.length})</TabsTab>
                    <TabsTab value="kuis">Kuis ({themeQuizzes.length})</TabsTab>
                  </TabsList>

                  <TabsPanel value="materi">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Materi</CardTitle>
                        <AddContentItemDialog courseId={courseId} themeId={theme.id} themeTitle={theme.title} />
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        {themeContentItems.map((item) => (
                          <div key={item.id} className="rounded-md border p-3 text-sm">
                            <p className="font-medium">
                              {item.title}{" "}
                              <span className="text-muted-foreground">({label(CONTENT_ITEM_TYPE_LABELS, item.type)})</span>
                            </p>
                            <div className="mt-1">
                              <ContentItemView item={item} />
                            </div>
                          </div>
                        ))}
                        {themeContentItems.length === 0 && <p className="text-sm text-muted-foreground">Belum ada materi</p>}
                      </CardContent>
                    </Card>
                  </TabsPanel>

                  <TabsPanel value="tugas">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Tugas</CardTitle>
                        <AddAssignmentDialog courseId={courseId} themeId={theme.id} themeTitle={theme.title} />
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        {themeAssignments.map((a) => (
                          <Link
                            key={a.id}
                            href={`/teacher/assignments/${a.id}`}
                            className="rounded-md border p-3 text-sm hover:bg-muted"
                          >
                            {a.title} — tenggat {a.dueDate} — {a.maxScore} poin
                          </Link>
                        ))}
                        {themeAssignments.length === 0 && <p className="text-sm text-muted-foreground">Belum ada tugas</p>}
                      </CardContent>
                    </Card>
                  </TabsPanel>

                  <TabsPanel value="kuis">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Kuis</CardTitle>
                        <AddQuizDialog courseId={courseId} themeId={theme.id} themeTitle={theme.title} />
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        {themeQuizzes.map((q) => (
                          <Link key={q.id} href={`/teacher/quizzes/${q.id}`} className="rounded-md border p-3 text-sm hover:bg-muted">
                            {q.title} — maks {q.maxAttempts} percobaan
                          </Link>
                        ))}
                        {themeQuizzes.length === 0 && <p className="text-sm text-muted-foreground">Belum ada kuis</p>}
                      </CardContent>
                    </Card>
                  </TabsPanel>
                </Tabs>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
