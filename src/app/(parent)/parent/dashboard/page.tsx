import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService } from "@/server/services/guardian-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ParentDashboardPage() {
  const user = await requireRole(["parent"]);
  const { children } = await GuardianService.childrenForGuardianUser(user.id);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Beranda Orang Tua</h1>
        <p className="text-sm text-muted-foreground">Pantau kehadiran, biaya, dan nilai anak Anda.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Anak Anda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/parent/children/${child.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </span>
              <span className="flex-1 font-medium">
                {child.firstName} {child.lastName}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
          {children.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada anak yang terhubung ke akun Anda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
