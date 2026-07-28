import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/academic-years", label: "Academic years" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/fees", label: "Fees" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["admin"]);
  return (
    <RoleShell roleLabel="Admin" email={user.email} navItems={NAV_ITEMS}>
      {children}
    </RoleShell>
  );
}
