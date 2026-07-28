import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

const NAV_ITEMS = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/courses", label: "Courses" },
  { href: "/student/grades", label: "Grades" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["student"]);
  return (
    <RoleShell roleLabel="Student" email={user.email} navItems={NAV_ITEMS}>
      {children}
    </RoleShell>
  );
}
