import Link from "next/link";
import { ChevronRight, UserRound, Wallet } from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService } from "@/server/services/guardian-service";
import { FeeService } from "@/server/services/fee-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

export default async function ParentDashboardPage() {
  const user = await requireRole(["parent"]);
  const { children } = await GuardianService.childrenForGuardianUser(user.id);

  // Cheap here (a handful of children per parent at most) — unlike the
  // child-detail tabs, this doesn't need lazy-loading (see child-detail-tabs.tsx).
  const outstandingByChild = await Promise.all(
    children.map(async (child) => {
      const invoices = await FeeService.invoicesForStudent(child.id);
      const balanceCents = invoices.reduce((sum, i) => sum + Math.max(0, i.balanceCents), 0);
      return { child, balanceCents };
    })
  );
  const owing = outstandingByChild.filter((row) => row.balanceCents > 0);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Beranda Orang Tua</h1>
        <p className="text-sm text-muted-foreground">Pantau kehadiran, biaya, dan nilai anak Anda.</p>
      </div>

      {owing.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Wallet className="size-4" />
              Tagihan Belum Dibayar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {owing.map(({ child, balanceCents }) => (
              <Link
                key={child.id}
                href={`/parent/children/${child.id}?tab=biaya`}
                className="flex items-center justify-between rounded-lg border border-destructive/20 bg-background p-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium">
                  {child.firstName} {child.lastName}
                </span>
                <span className="text-destructive">{formatCents(balanceCents)} belum dibayar</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

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
