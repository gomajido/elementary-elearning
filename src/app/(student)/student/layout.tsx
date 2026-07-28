import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["student"]);
  return (
    <RoleShell roleLabel="Student" email={user.email}>
      {children}
    </RoleShell>
  );
}
