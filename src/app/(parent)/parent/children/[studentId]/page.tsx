import { notFound } from "next/navigation";
import Link from "next/link";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService, GuardianPortalError } from "@/server/services/guardian-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { ChildDetailTabs } from "@/components/dashboard/child-detail-tabs";
import { Button } from "@/components/ui/button";

const TAB_VALUES = ["nilai", "kehadiran", "biaya"] as const;
type TabValue = (typeof TAB_VALUES)[number];

export default async function ChildDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole(["parent"]);
  const { studentId } = await params;
  const { tab } = await searchParams;

  try {
    await GuardianService.assertGuardianOwnsStudent(user.id, studentId);
  } catch (err) {
    if (err instanceof GuardianPortalError) notFound();
    throw err;
  }

  // Only `student` (cheap: one row) is fetched here — grades/attendance/fees
  // are fetched lazily per-tab by ChildDetailTabs, not up front (see
  // parent-controller.ts).
  const student = await StudentRepository.findById(studentId);
  if (!student) notFound();

  const initialTab: TabValue = TAB_VALUES.includes(tab as TabValue) ? (tab as TabValue) : "nilai";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {student.firstName} {student.lastName}
        </h1>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/parent/children/${studentId}/report-card`} />}>
          Lihat Rapor
        </Button>
      </div>

      <ChildDetailTabs studentId={studentId} initialTab={initialTab} />
    </div>
  );
}
