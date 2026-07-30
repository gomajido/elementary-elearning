import { FeeService } from "@/server/services/fee-service";
import { AcademicService } from "@/server/services/academic-service";
import { StudentService } from "@/server/services/student-service";
import { InvoiceGenerateForm } from "@/components/forms/invoice-generate-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { InvoicesTable } from "@/components/tables/invoices-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function InvoicesPage() {
  const [invoices, students, classes, academicYears, feeStructures] = await Promise.all([
    FeeService.allInvoicesWithSummary(),
    StudentService.listStudents(),
    AcademicService.listClasses(),
    AcademicService.listAcademicYears(),
    FeeService.listFeeStructures(),
  ]);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tagihan</h1>
        <ActionDialog triggerLabel="Tagihan Baru" title="Buat tagihan" contentClassName="sm:max-w-xl">
          <InvoiceGenerateForm
            students={students}
            classes={classes}
            academicYears={academicYears}
            feeStructures={feeStructures}
          />
        </ActionDialog>
      </div>

      <Card>
        <CardContent>
          <InvoicesTable rows={invoices} />
        </CardContent>
      </Card>
    </div>
  );
}
