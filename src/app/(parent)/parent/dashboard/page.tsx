import Link from "next/link";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService } from "@/server/services/guardian-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ParentDashboardPage() {
  const user = await requireRole(["parent"]);
  const { children } = await GuardianService.childrenForGuardianUser(user.id);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Anak Anda</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/parent/children/${child.id}`}
            className="rounded-md border p-3 text-sm hover:bg-muted"
          >
            {child.firstName} {child.lastName}
          </Link>
        ))}
        {children.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada anak yang terhubung ke akun Anda.</p>
        )}
      </CardContent>
    </Card>
  );
}
