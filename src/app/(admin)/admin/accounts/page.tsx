import { UserRepository } from "@/server/repositories/user-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";
import { StudentRepository, GuardianRepository } from "@/server/repositories/student-repository";
import { requireRole } from "@/lib/auth/rbac";
import { AccountsTable } from "@/components/tables/accounts-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountsPage() {
  const viewer = await requireRole(["admin"]);

  const [accounts, teachers, students, guardianRows] = await Promise.all([
    UserRepository.listAll(),
    TeacherRepository.list(),
    StudentRepository.list(),
    GuardianRepository.listWithStudents(),
  ]);

  const nameByUserId: Record<string, string> = {};
  for (const t of teachers) if (t.userId) nameByUserId[t.userId] = `${t.firstName} ${t.lastName}`;
  for (const s of students) if (s.userId) nameByUserId[s.userId] = `${s.firstName} ${s.lastName}`;
  for (const { guardian } of guardianRows) {
    if (guardian.userId) nameByUserId[guardian.userId] = `${guardian.firstName} ${guardian.lastName}`;
  }

  return (
    <Card className="max-w-5xl">
      <CardHeader>
        <CardTitle>Manajemen Akun</CardTitle>
      </CardHeader>
      <CardContent>
        <AccountsTable accounts={accounts} nameByUserId={nameByUserId} viewerIsBaseAdmin={viewer.roles[0] === "admin"} />
      </CardContent>
    </Card>
  );
}
