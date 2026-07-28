import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["parent"]);
  return (
    <RoleShell roleLabel="Orang Tua" email={user.email}>
      {children}
    </RoleShell>
  );
}
