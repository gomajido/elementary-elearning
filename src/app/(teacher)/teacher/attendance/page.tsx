import Link from "next/link";

import { requireRole } from "@/lib/auth/rbac";
import { AttendanceService } from "@/server/services/attendance-service";
import { todayIsoDate } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeacherAttendancePage() {
  const user = await requireRole(["teacher"]);
  const { classes } = await AttendanceService.classesForTeacherUser(user.id);
  const today = todayIsoDate();

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Kelas perwalian Anda</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/teacher/attendance/${c.id}?date=${today}`}
            className="rounded-md border p-3 text-sm hover:bg-muted"
          >
            {c.name}
            {c.section ? ` ${c.section}` : ""} — isi absensi hari ini
          </Link>
        ))}
        {classes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Anda belum ditugaskan sebagai wali kelas untuk kelas manapun.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
