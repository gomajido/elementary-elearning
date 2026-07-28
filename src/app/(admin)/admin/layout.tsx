import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell } from "@/components/layout/role-shell";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dasbor" },
  { href: "/admin/students", label: "Siswa" },
  { href: "/admin/guardians", label: "Wali" },
  { href: "/admin/teachers", label: "Guru" },
  { href: "/admin/classes", label: "Kelas" },
  { href: "/admin/subjects", label: "Mata Pelajaran" },
  { href: "/admin/academic-years", label: "Tahun Ajaran" },
  { href: "/admin/attendance", label: "Kehadiran" },
  { href: "/admin/fees", label: "Biaya" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["admin"]);
  return (
    <RoleShell roleLabel="Admin" email={user.email} navItems={NAV_ITEMS}>
      {children}
    </RoleShell>
  );
}
