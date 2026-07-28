import { FeeService } from "@/server/services/fee-service";
import { AcademicService } from "@/server/services/academic-service";
import { FeeStructureForm } from "@/components/forms/fee-structure-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FEE_FREQUENCY_LABELS, label } from "@/lib/labels";

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
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
          <CardTitle>Tambah biaya</CardTitle>
        </CardHeader>
        <CardContent>
          <FeeStructureForm academicYears={academicYears} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Katalog Biaya</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Frekuensi</TableHead>
                <TableHead>Tingkat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{formatCents(s.amountCents)}</TableCell>
                  <TableCell>{label(FEE_FREQUENCY_LABELS, s.frequency)}</TableCell>
                  <TableCell>{s.gradeLevel ?? "Semua"}</TableCell>
                </TableRow>
              ))}
              {structures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada biaya
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
