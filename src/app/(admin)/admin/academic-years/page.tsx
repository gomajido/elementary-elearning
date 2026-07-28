import { AcademicService } from "@/server/services/academic-service";
import { AcademicYearForm } from "@/components/forms/academic-year-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AcademicYearsPage() {
  const years = await AcademicService.listAcademicYears();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah tahun ajaran</CardTitle>
        </CardHeader>
        <CardContent>
          <AcademicYearForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tahun Ajaran</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Selesai</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>{year.name}</TableCell>
                  <TableCell>{year.startDate}</TableCell>
                  <TableCell>{year.endDate}</TableCell>
                  <TableCell>{year.isCurrent && <Badge>Aktif</Badge>}</TableCell>
                </TableRow>
              ))}
              {years.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada tahun ajaran
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
