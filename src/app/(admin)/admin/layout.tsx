import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["admin"]);
  return (
    <RoleShell roleLabel="Admin" email={user.email}>
      {children}
    </RoleShell>
  );
}
