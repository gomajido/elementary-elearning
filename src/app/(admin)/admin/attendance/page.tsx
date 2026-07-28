import Link from "next/link";

import { AcademicService } from "@/server/services/academic-service";
import { todayIsoDate } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAttendanceOverviewPage() {
  const classes = await AcademicService.listClasses();
  const today = todayIsoDate();

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Attendance by class</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/admin/attendance/${c.id}?date=${today}`}
            className="rounded-md border p-3 text-sm hover:bg-muted"
          >
            {c.name}
            {c.section ? ` ${c.section}` : ""} — today&apos;s register
          </Link>
        ))}
        {classes.length === 0 && <p className="text-sm text-muted-foreground">No classes yet</p>}
      </CardContent>
    </Card>
  );
}
