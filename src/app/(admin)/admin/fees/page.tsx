import Link from "next/link";
import { Tags, Receipt, ArrowRight, ShieldAlert, Wallet } from "lucide-react";

import { FeeService } from "@/server/services/fee-service";
import { OutstandingTable } from "@/components/tables/outstanding-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

export default async function FeesOverviewPage() {
  const allInvoices = await FeeService.allInvoicesWithSummary();
  const outstanding = allInvoices.filter((row) => row.balanceCents > 0);
  const totalOutstandingCents = outstanding.reduce((sum, row) => sum + row.balanceCents, 0);
  const totalCollectedCents = allInvoices.reduce((sum, row) => sum + row.paidCents, 0);
  const pendingVerificationCount = allInvoices.filter((row) => row.hasPendingVerification).length;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Biaya</h1>
        <p className="text-sm text-muted-foreground">Kelola katalog biaya, tagihan, dan pembayaran siswa.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Total Tunggakan"
          value={formatCents(totalOutstandingCents)}
          tone={outstanding.length > 0 ? "warning" : "default"}
        />
        <StatCard icon={Receipt} label="Total Terkumpul" value={formatCents(totalCollectedCents)} />
        <StatCard
          icon={ShieldAlert}
          label="Menunggu Verifikasi"
          value={pendingVerificationCount}
          tone={pendingVerificationCount > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/fees/structures">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Tags className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Katalog Biaya</p>
                <p className="text-xs text-muted-foreground">Kelola jenis dan jumlah biaya</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/fees/invoices">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Receipt className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Tagihan</p>
                <p className="text-xs text-muted-foreground">Buat dan kelola tagihan siswa</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tunggakan</CardTitle>
        </CardHeader>
        <CardContent>
          <OutstandingTable rows={outstanding} />
        </CardContent>
      </Card>
    </div>
  );
}
