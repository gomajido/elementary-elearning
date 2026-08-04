import Link from "next/link";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService } from "@/server/services/course-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentCoursesPage() {
  const user = await requireRole(["student"]);
  const student = await StudentRepository.findByUserId(user.id);
  const courses = student ? await CourseService.coursesForStudentUser(student.id) : [];

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <h1 className="text-2xl font-semibold">Modul Kamu</h1>
      {courses.map(({ course, subjectName }) => (
        <Link key={course.id} href={`/student/courses/${course.id}`}>
          <Card className="transition-colors hover:bg-muted">
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{subjectName}</CardContent>
          </Card>
        </Link>
      ))}
      {courses.length === 0 && (
        <p className="text-base text-muted-foreground">Belum ada modul — cek lagi nanti, ya!</p>
      )}
    </div>
  );
}
