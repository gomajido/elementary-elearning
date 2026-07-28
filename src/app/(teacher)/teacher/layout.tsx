import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["teacher"]);
  return (
    <RoleShell roleLabel="Teacher" email={user.email}>
      {children}
    </RoleShell>
  );
}
