import { AcademicService } from "@/server/services/academic-service";
import { TeacherService } from "@/server/services/teacher-service";
import { MediaRepository } from "@/server/repositories/media-repository";
import { ClassForm } from "@/components/forms/class-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { ClassesTable } from "@/components/tables/classes-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function ClassesPage() {
  const [classRows, academicYears, teachers] = await Promise.all([
    AcademicService.listClassesWithDetails(),
    AcademicService.listAcademicYears(),
    TeacherService.listTeachers(),
  ]);
  const media = await MediaRepository.findManyForEntities(
    "class",
    classRows.map((r) => r.class.id),
  );
  const photoByClassId = Object.fromEntries(
    media.map((m) => [m.entityId, { storageKey: m.storageKey, updatedAt: m.updatedAt }]),
  );

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kelas</h1>
        <ActionDialog triggerLabel="Kelas Baru" title="Tambah kelas">
          <ClassForm academicYears={academicYears} teachers={teachers} />
        </ActionDialog>
      </div>

      <Card>
        <CardContent>
          <ClassesTable rows={classRows} academicYears={academicYears} teachers={teachers} photoByClassId={photoByClassId} />
        </CardContent>
      </Card>
    </div>
  );
}
