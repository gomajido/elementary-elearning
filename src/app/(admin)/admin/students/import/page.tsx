import { requireRole } from "@/lib/auth/rbac";
import { AcademicService } from "@/server/services/academic-service";
import { StudentImportFlow } from "@/components/forms/student-import-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentImportPage() {
  await requireRole(["admin"]);
  const academicYears = await AcademicService.listAcademicYears();

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Impor Siswa dari CSV</CardTitle>
      </CardHeader>
      <CardContent>
        <StudentImportFlow academicYears={academicYears.map((y) => ({ id: y.id, name: y.name }))} />
      </CardContent>
    </Card>
  );
}
