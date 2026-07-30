import { TeacherService } from "@/server/services/teacher-service";
import { MediaRepository } from "@/server/repositories/media-repository";
import { TeacherForm } from "@/components/forms/teacher-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { TeachersTable } from "@/components/tables/teachers-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function TeachersPage() {
  const teachers = await TeacherService.listTeachers();
  const media = await MediaRepository.findManyForEntities(
    "teacher",
    teachers.map((t) => t.id),
  );
  const photoByTeacherId = Object.fromEntries(
    media.map((m) => [m.entityId, { storageKey: m.storageKey, updatedAt: m.updatedAt }]),
  );

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Guru</h1>
        <ActionDialog triggerLabel="Guru Baru" title="Tambah guru">
          <TeacherForm />
        </ActionDialog>
      </div>

      <Card>
        <CardContent>
          <TeachersTable rows={teachers} photoByTeacherId={photoByTeacherId} />
        </CardContent>
      </Card>
    </div>
  );
}
