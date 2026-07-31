import { requireRole } from "@/lib/auth/rbac";
import { TeacherImportFlow } from "@/components/forms/teacher-import-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeacherImportPage() {
  await requireRole(["admin"]);

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Impor Guru dari CSV</CardTitle>
      </CardHeader>
      <CardContent>
        <TeacherImportFlow />
      </CardContent>
    </Card>
  );
}
