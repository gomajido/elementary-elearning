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
          <CardTitle>Add academic year</CardTitle>
        </CardHeader>
        <CardContent>
          <AcademicYearForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic years</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>{year.name}</TableCell>
                  <TableCell>{year.startDate}</TableCell>
                  <TableCell>{year.endDate}</TableCell>
                  <TableCell>{year.isCurrent && <Badge>Current</Badge>}</TableCell>
                </TableRow>
              ))}
              {years.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No academic years yet
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
