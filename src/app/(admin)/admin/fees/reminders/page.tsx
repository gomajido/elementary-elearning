import { requireRole } from "@/lib/auth/rbac";
import { ReminderService } from "@/server/services/reminder-service";
import { ReminderTable } from "@/components/tables/reminder-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FeeRemindersPage() {
  await requireRole(["admin"]);
  const rows = await ReminderService.eligibleInvoices();

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Kirim Pengingat Pembayaran</CardTitle>
      </CardHeader>
      <CardContent>
        <ReminderTable rows={rows} />
      </CardContent>
    </Card>
  );
}
