import { StudentRepository } from "@/server/repositories/student-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";
import { AttendanceImportFlow } from "@/components/forms/attendance-import-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AttendanceImportPage() {
  const [students, teachers] = await Promise.all([StudentRepository.list(), TeacherRepository.list()]);

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Impor Kehadiran dari Mesin Fingerprint</CardTitle>
      </CardHeader>
      <CardContent>
        <AttendanceImportFlow students={students} teachers={teachers} />
      </CardContent>
    </Card>
  );
}
