import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService, CourseError } from "@/server/services/course-service";
import { AssignmentService } from "@/server/services/assignment-service";
import { QuizService } from "@/server/services/quiz-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { startAttemptAction } from "@/server/controllers/quiz-controller";
import { ContentItemView } from "@/components/content-item-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from "@/components/ui/accordion";

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

      {detail.themes.length === 0 && <p className="text-muted-foreground">Belum ada materi di modul ini.</p>}

      <Accordion multiple className="flex flex-col gap-3">
        {detail.themes.map((theme) => {
          const themeContentItems = detail.contentItems.filter((item) => item.themeId === theme.id);
          const themeAssignments = assignments.filter((a) => a.themeId === theme.id);
          const themeQuizzes = quizzes.filter(({ quiz }) => quiz.themeId === theme.id);

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
                      <CardHeader>
                        <CardTitle className="text-lg">Materi</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {themeContentItems.map((item) => (
                          <div key={item.id} className="rounded-lg border p-4">
                            <p className="text-base font-medium">{item.title}</p>
                            <div className="mt-1">
                              <ContentItemView item={item} />
                            </div>
                          </div>
                        ))}
                        {themeContentItems.length === 0 && <p className="text-muted-foreground">Belum ada materi di sini.</p>}
                      </CardContent>
                    </Card>
                  </TabsPanel>

                  <TabsPanel value="tugas">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tugas</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {themeAssignments.map((a) => (
                          <Link key={a.id} href={`/student/assignments/${a.id}`} className="rounded-lg border p-4 hover:bg-muted">
                            <p className="text-base font-medium">{a.title}</p>
                            <p className="text-sm text-muted-foreground">Tenggat {a.dueDate}</p>
                          </Link>
                        ))}
                        {themeAssignments.length === 0 && <p className="text-muted-foreground">Belum ada tugas.</p>}
                      </CardContent>
                    </Card>
                  </TabsPanel>

                  <TabsPanel value="kuis">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Kuis</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {themeQuizzes.map(({ quiz, attemptsRemaining }) => (
                          <div key={quiz.id} className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <p className="text-base font-medium">{quiz.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {attemptsRemaining > 0 ? `Sisa ${attemptsRemaining} percobaan` : "Tidak ada percobaan tersisa"}
                              </p>
                            </div>
                            {attemptsRemaining > 0 && (
                              <form action={startAttemptAction.bind(null, quiz.id)}>
                                <Button type="submit">Mulai kuis</Button>
                              </form>
                            )}
                          </div>
                        ))}
                        {themeQuizzes.length === 0 && <p className="text-muted-foreground">Belum ada kuis.</p>}
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
