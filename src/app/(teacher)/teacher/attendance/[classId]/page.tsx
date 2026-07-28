import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService } from "@/server/services/attendance-service";
import { ClassRepository } from "@/server/repositories/academic-repository";
import { todayIsoDate } from "@/lib/date";
import { AttendanceRegisterForm } from "@/components/forms/attendance-register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeacherClassAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  await requireRole(["teacher"]);
  const { classId } = await params;
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayIsoDate();

  const [classRow, roster] = await Promise.all([
    ClassRepository.findById(classId),
    AttendanceService.rosterForClassAndDate(classId, date),
  ]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {classRow?.name}
          {classRow?.section ? ` ${classRow.section}` : ""} — {date}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AttendanceRegisterForm classId={classId} date={date} roster={roster} />
      </CardContent>
    </Card>
  );
}
