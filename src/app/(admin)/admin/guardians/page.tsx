import { GuardianService } from "@/server/services/guardian-service";
import { GrantGuardianAccessForm } from "@/components/forms/grant-guardian-access-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function GuardiansPage() {
  const rows = await GuardianService.listGuardiansWithStudents();

  const byId = new Map<
    string,
    { guardian: (typeof rows)[number]["guardian"]; children: string[] }
  >();
  for (const row of rows) {
    const entry = byId.get(row.guardian.id) ?? { guardian: row.guardian, children: [] };
    if (row.student) entry.children.push(`${row.student.firstName} ${row.student.lastName}`);
    byId.set(row.guardian.id, entry);
  }
  const guardians = Array.from(byId.values());

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Wali</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Anak</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Akses Portal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guardians.map(({ guardian, children }) => (
              <TableRow key={guardian.id}>
                <TableCell>
                  {guardian.firstName} {guardian.lastName}
                </TableCell>
                <TableCell>{children.join(", ") || "—"}</TableCell>
                <TableCell>{guardian.phone ?? guardian.email ?? "—"}</TableCell>
                <TableCell>
                  {guardian.userId ? (
                    <Badge variant="secondary">Aktif</Badge>
                  ) : (
                    <GrantGuardianAccessForm guardianId={guardian.id} defaultEmail={guardian.email ?? undefined} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {guardians.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada wali
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
