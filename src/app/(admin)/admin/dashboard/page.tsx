import { GraduationCap, UserCog, School, Wallet } from "lucide-react";

import { StudentService } from "@/server/services/student-service";
import { TeacherService } from "@/server/services/teacher-service";
import { AcademicService } from "@/server/services/academic-service";
import { FeeService } from "@/server/services/fee-service";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function AdminDashboardPage() {
  const [students, teachers, classes, outstanding] = await Promise.all([
    StudentService.listStudentsWithDetails(),
    TeacherService.listTeachers(),
    AcademicService.listClasses(),
    FeeService.outstandingBalanceReport(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Beranda Admin</h1>
        <p className="text-sm text-muted-foreground">
          Gunakan menu di samping untuk mengelola siswa, guru, kelas, kehadiran, dan biaya.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={GraduationCap} label="Total Siswa" value={students.length} />
        <StatCard icon={UserCog} label="Total Guru" value={teachers.length} />
        <StatCard icon={School} label="Kelas Aktif" value={classes.length} />
        <StatCard
          icon={Wallet}
          label="Tagihan Belum Lunas"
          value={outstanding.length}
          tone={outstanding.length > 0 ? "warning" : "default"}
        />
      </div>
    </div>
  );
}
