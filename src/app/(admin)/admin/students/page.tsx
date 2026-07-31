import Link from "next/link";

import { StudentService } from "@/server/services/student-service";
import { AcademicService } from "@/server/services/academic-service";
import { MediaRepository } from "@/server/repositories/media-repository";
import { StudentForm } from "@/components/forms/student-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { StudentsTable } from "@/components/tables/students-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function StudentsPage() {
  const [studentRows, classes, academicYears] = await Promise.all([
    StudentService.listStudentsWithDetails(),
    AcademicService.listClasses(),
    AcademicService.listAcademicYears(),
  ]);
  const media = await MediaRepository.findManyForEntities(
    "student",
    studentRows.map((r) => r.student.id),
  );
  const photoByStudentId = Object.fromEntries(
    media.map((m) => [m.entityId, { storageKey: m.storageKey, updatedAt: m.updatedAt }]),
  );

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Siswa</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/admin/students/import" />}>
            Impor CSV
          </Button>
          <ActionDialog triggerLabel="Siswa Baru" title="Daftarkan siswa" contentClassName="sm:max-w-2xl">
            <StudentForm classes={classes} academicYears={academicYears} />
          </ActionDialog>
        </div>
      </div>

      <Card>
        <CardContent>
          <StudentsTable rows={studentRows} classes={classes} photoByStudentId={photoByStudentId} />
        </CardContent>
      </Card>
    </div>
  );
}
