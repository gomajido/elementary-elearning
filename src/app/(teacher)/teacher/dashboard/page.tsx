import { BookOpen, School, ClipboardList } from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { CourseService } from "@/server/services/course-service";
import { AttendanceService } from "@/server/services/attendance-service";
import { AssignmentService } from "@/server/services/assignment-service";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function TeacherDashboardPage() {
  const user = await requireRole(["teacher"]);
  const [{ courses }, { classes }] = await Promise.all([
    CourseService.coursesForTeacherUser(user.id),
    AttendanceService.classesForTeacherUser(user.id),
  ]);

  const assignmentsPerCourse = await Promise.all(courses.map(({ course }) => AssignmentService.listForCourse(course.id)));
  const submissionsPerAssignment = await Promise.all(
    assignmentsPerCourse.flat().map((assignment) => AssignmentService.submissionsForAssignment(assignment.id)),
  );
  const ungradedCount = submissionsPerAssignment
    .flat()
    .filter((row) => row.submission.status === "submitted" || row.submission.status === "late").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Beranda Guru</h1>
        <p className="text-sm text-muted-foreground">Gunakan menu di samping untuk kehadiran kelas dan kursus Anda.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Kursus Saya" value={courses.length} />
        <StatCard icon={School} label="Kelas Wali" value={classes.length} />
        <StatCard
          icon={ClipboardList}
          label="Tugas Perlu Dinilai"
          value={ungradedCount}
          tone={ungradedCount > 0 ? "warning" : "default"}
        />
      </div>
    </div>
  );
}
