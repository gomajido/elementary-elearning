import { RegistrationService } from "@/server/services/registration-service";
import { AcademicService } from "@/server/services/academic-service";
import { RegistrationQueueTable } from "@/components/tables/registration-queue-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeacherRegistrationsPage() {
  const [applications, classes, academicYears] = await Promise.all([
    RegistrationService.listPending(),
    AcademicService.listClasses(),
    AcademicService.listAcademicYears(),
  ]);

  return (
    <Card className="max-w-5xl">
      <CardHeader>
        <CardTitle>Pendaftaran Siswa Baru — Menunggu Persetujuan</CardTitle>
      </CardHeader>
      <CardContent>
        <RegistrationQueueTable applications={applications} classes={classes} academicYears={academicYears} />
      </CardContent>
    </Card>
  );
}
