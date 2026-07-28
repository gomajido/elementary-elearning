import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

const NAV_ITEMS = [
  { href: "/student/dashboard", label: "Dasbor" },
  { href: "/student/courses", label: "Kursus" },
  { href: "/student/grades", label: "Nilai" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["student"]);
  return (
    <RoleShell roleLabel="Siswa" email={user.email} navItems={NAV_ITEMS}>
      {children}
    </RoleShell>
  );
}
