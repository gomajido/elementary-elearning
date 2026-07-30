import { AcademicService } from "@/server/services/academic-service";
import { SubjectForm } from "@/components/forms/subject-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { SubjectsTable } from "@/components/tables/subjects-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function SubjectsPage() {
  const subjects = await AcademicService.listSubjects();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mata Pelajaran</h1>
        <ActionDialog triggerLabel="Mata Pelajaran Baru" title="Tambah mata pelajaran">
          <SubjectForm />
        </ActionDialog>
      </div>

      <Card>
        <CardContent>
          <SubjectsTable rows={subjects} />
        </CardContent>
      </Card>
    </div>
  );
}
