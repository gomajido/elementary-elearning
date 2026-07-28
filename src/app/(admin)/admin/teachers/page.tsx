import { TeacherService } from "@/server/services/teacher-service";
import { TeacherForm } from "@/components/forms/teacher-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TeachersPage() {
  const teachers = await TeacherService.listTeachers();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah guru</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. Pegawai</TableHead>
                <TableHead>Telepon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    {teacher.firstName} {teacher.lastName}
                  </TableCell>
                  <TableCell>{teacher.employeeNumber}</TableCell>
                  <TableCell>{teacher.phone ?? "—"}</TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Belum ada guru
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
