import { AcademicService } from "@/server/services/academic-service";
import { AcademicYearForm } from "@/components/forms/academic-year-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { AcademicYearsTable } from "@/components/tables/academic-years-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function AcademicYearsPage() {
  const years = await AcademicService.listAcademicYears();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tahun Ajaran</h1>
        <ActionDialog triggerLabel="Tahun Ajaran Baru" title="Tambah tahun ajaran">
          <AcademicYearForm />
        </ActionDialog>
      </div>

      <Card>
        <CardContent>
          <AcademicYearsTable rows={years} />
        </CardContent>
      </Card>
    </div>
  );
}
