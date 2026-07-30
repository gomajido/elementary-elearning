import { FeeService } from "@/server/services/fee-service";
import { AcademicService } from "@/server/services/academic-service";
import { FeeStructureForm } from "@/components/forms/fee-structure-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { FeeStructuresTable } from "@/components/tables/fee-structures-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function FeeStructuresPage() {
  const [structures, academicYears] = await Promise.all([
    FeeService.listFeeStructures(),
    AcademicService.listAcademicYears(),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Katalog Biaya</h1>
        <ActionDialog triggerLabel="Biaya Baru" title="Tambah biaya">
          <FeeStructureForm academicYears={academicYears} />
        </ActionDialog>
      </div>

      <Card>
        <CardContent>
          <FeeStructuresTable rows={structures} academicYears={academicYears} />
        </CardContent>
      </Card>
    </div>
  );
}
