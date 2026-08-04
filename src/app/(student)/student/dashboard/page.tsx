import { BookOpen, FileCheck, Award } from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { StudentRepository } from "@/server/repositories/student-repository";
import { CourseService } from "@/server/services/course-service";
import { GradeService } from "@/server/services/grade-service";
import { Card, CardContent } from "@/components/ui/card";
import { PlayfulStatTile } from "@/components/dashboard/playful-stat-tile";

export default async function StudentDashboardPage() {
  const user = await requireRole(["student"]);
  const student = await StudentRepository.findByUserId(user.id);

  const [courses, grades] = student
    ? await Promise.all([CourseService.coursesForStudentUser(student.id), GradeService.gradesForStudent(student.id)])
    : [[], { assignments: [], quizzes: [] }];

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-3xl border-none bg-gradient-to-br from-student-accent to-sky-500 text-student-accent-foreground">
        <CardContent className="flex flex-col gap-1 py-6">
          <p className="font-[family-name:var(--font-playful)] text-3xl font-semibold">Semangat belajar! 🚀</p>
          <p className="text-base opacity-90">Lihat modul dan kuismu di menu bawah ya!</p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <PlayfulStatTile icon={BookOpen} label="Modul" value={courses.length} color="sky" />
        <PlayfulStatTile icon={FileCheck} label="Tugas Terkumpul" value={grades.assignments.length} color="violet" />
        <PlayfulStatTile icon={Award} label="Kuis Selesai" value={grades.quizzes.length} color="amber" />
      </div>
    </div>
  );
}
