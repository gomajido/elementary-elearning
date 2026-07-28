import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

const NAV_ITEMS = [
  { href: "/teacher/dashboard", label: "Dashboard" },
  { href: "/teacher/attendance", label: "Attendance" },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["teacher"]);
  return (
    <RoleShell roleLabel="Teacher" email={user.email} navItems={NAV_ITEMS}>
      {children}
    </RoleShell>
  );
}
