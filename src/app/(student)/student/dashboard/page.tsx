import { BookOpen, FileCheck, Award } from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { StudentRepository } from "@/server/repositories/student-repository";
import { CourseService } from "@/server/services/course-service";
import { GradeService } from "@/server/services/grade-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function StudentDashboardPage() {
  const user = await requireRole(["student"]);
  const student = await StudentRepository.findByUserId(user.id);

  const [courses, grades] = student
    ? await Promise.all([CourseService.coursesForStudentUser(student.id), GradeService.gradesForStudent(student.id)])
    : [[], { assignments: [], quizzes: [] }];

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none bg-student-accent text-student-accent-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">Selamat datang!</CardTitle>
        </CardHeader>
        <CardContent className="text-base opacity-90">Lihat kursus dan kuismu di menu bawah.</CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={BookOpen} label="Kursus" value={courses.length} />
        <StatCard icon={FileCheck} label="Tugas Terkumpul" value={grades.assignments.length} />
        <StatCard icon={Award} label="Kuis Selesai" value={grades.quizzes.length} />
      </div>
    </div>
  );
}
