import { RegistrationService } from "@/server/services/registration-service";
import { AcademicService } from "@/server/services/academic-service";
import { RegistrationQueueTable } from "@/components/tables/registration-queue-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminRegistrationsPage() {
  const [applications, classes, academicYears] = await Promise.all([
    RegistrationService.listPending(),
    AcademicService.listClasses(),
    AcademicService.listAcademicYears(),
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Pendaftaran Siswa Baru</h1>
      <Card>
        <CardHeader>
          <CardTitle>Menunggu Persetujuan</CardTitle>
        </CardHeader>
        <CardContent>
          <RegistrationQueueTable applications={applications} classes={classes} academicYears={academicYears} />
        </CardContent>
      </Card>
    </div>
  );
}
