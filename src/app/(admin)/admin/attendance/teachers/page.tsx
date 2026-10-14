import { AttendanceService } from "@/server/services/attendance-service";
import { TeacherAttendanceTable } from "@/components/tables/teacher-attendance-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminTeacherAttendancePage() {
  const rows = await AttendanceService.listTeacherAttendance();

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Kehadiran Guru</CardTitle>
      </CardHeader>
      <CardContent>
        <TeacherAttendanceTable rows={rows} />
      </CardContent>
    </Card>
  );
}
