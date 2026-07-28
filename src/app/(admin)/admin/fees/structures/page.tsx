import { FeeService } from "@/server/services/fee-service";
import { AcademicService } from "@/server/services/academic-service";
import { FeeStructureForm } from "@/components/forms/fee-structure-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function FeeStructuresPage() {
  const [structures, academicYears] = await Promise.all([
    FeeService.listFeeStructures(),
    AcademicService.listAcademicYears(),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add fee</CardTitle>
        </CardHeader>
        <CardContent>
          <FeeStructureForm academicYears={academicYears} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Grade level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{formatCents(s.amountCents)}</TableCell>
                  <TableCell className="capitalize">{s.frequency.replace("_", " ")}</TableCell>
                  <TableCell>{s.gradeLevel ?? "All"}</TableCell>
                </TableRow>
              ))}
              {structures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No fees yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
