import Link from "next/link";

import { AcademicService } from "@/server/services/academic-service";
import { todayIsoDate } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminAttendanceOverviewPage() {
  const classes = await AcademicService.listClasses();
  const today = todayIsoDate();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kehadiran</h1>
        <Button nativeButton={false} render={<Link href="/admin/attendance/import" />}>
          Impor kehadiran dari mesin fingerprint (Excel)
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kehadiran per kelas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/admin/attendance/${c.id}?date=${today}`}
                className="rounded-md border p-3 text-sm hover:bg-muted"
              >
                {c.name}
                {c.section ? ` ${c.section}` : ""} — absensi hari ini
              </Link>
            ))}
            {classes.length === 0 && <p className="text-sm text-muted-foreground">Belum ada kelas</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kehadiran guru</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/admin/attendance/teachers" className="rounded-md border p-3 text-sm hover:bg-muted">
              Lihat kehadiran guru
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
