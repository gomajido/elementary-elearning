import Link from "next/link";

import { TeacherService } from "@/server/services/teacher-service";
import { MediaRepository } from "@/server/repositories/media-repository";
import { TeacherForm } from "@/components/forms/teacher-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { TeachersTable } from "@/components/tables/teachers-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <div className="flex items-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/teachers/import" />}>
            Impor CSV
          </Button>
          <ActionDialog triggerLabel="Guru Baru" title="Tambah guru">
            <TeacherForm />
          </ActionDialog>
        </div>
      </div>

      <Card>
        <CardContent>
          <TeachersTable rows={teachers} photoByTeacherId={photoByTeacherId} />
        </CardContent>
      </Card>
    </div>
  );
}
