import Link from "next/link";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService } from "@/server/services/course-service";
import { AcademicService } from "@/server/services/academic-service";
import { CourseForm } from "@/components/forms/course-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeacherCoursesPage() {
  const user = await requireRole(["teacher"]);
  const [{ courses }, subjects, classes, academicYears] = await Promise.all([
    CourseService.coursesForTeacherUser(user.id),
    AcademicService.listSubjects(),
    AcademicService.listClasses(),
    AcademicService.listAcademicYears(),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create course</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm subjects={subjects} classes={classes} academicYears={academicYears} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your courses</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {courses.map(({ course, subjectName, className, classSection }) => (
            <Link
              key={course.id}
              href={`/teacher/courses/${course.id}`}
              className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted"
            >
              <span>
                {course.title} — {subjectName} — {className}
                {classSection ? ` ${classSection}` : ""}
              </span>
              <Badge variant={course.isPublished ? "secondary" : "outline"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
            </Link>
          ))}
          {courses.length === 0 && <p className="text-sm text-muted-foreground">No courses yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
