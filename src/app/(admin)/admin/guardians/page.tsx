import { GuardianService } from "@/server/services/guardian-service";
import { MediaRepository } from "@/server/repositories/media-repository";
import { GuardiansTable } from "@/components/tables/guardians-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const media = await MediaRepository.findManyForEntities(
    "guardian",
    guardians.map((g) => g.guardian.id),
  );
  const photoByGuardianId = Object.fromEntries(
    media.map((m) => [m.entityId, { storageKey: m.storageKey, updatedAt: m.updatedAt }]),
  );

  return (
    <Card className="max-w-6xl">
      <CardHeader>
        <CardTitle>Wali</CardTitle>
      </CardHeader>
      <CardContent>
        <GuardiansTable rows={guardians} photoByGuardianId={photoByGuardianId} />
      </CardContent>
    </Card>
  );
}
