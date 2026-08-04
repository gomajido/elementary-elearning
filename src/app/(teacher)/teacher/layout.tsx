import type { ReactNode } from "react";
import { LayoutDashboard, ClipboardCheck, BookOpen, ShieldCheck } from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { RoleShell, type RoleNavItem } from "@/components/layout/role-shell";

const ICON_CLASS = "size-4 shrink-0";

const NAV_ITEMS: RoleNavItem[] = [
  { href: "/teacher/dashboard", label: "Beranda", icon: <LayoutDashboard className={ICON_CLASS} /> },
  { href: "/teacher/attendance", label: "Kehadiran", icon: <ClipboardCheck className={ICON_CLASS} /> },
  { href: "/teacher/courses", label: "Modul", icon: <BookOpen className={ICON_CLASS} /> },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["teacher"]);
  const navItems =
    user.roles[0] !== "admin" && user.roles.includes("admin")
      ? [...NAV_ITEMS, { href: "/admin/dashboard", label: "Portal Admin", icon: <ShieldCheck className={ICON_CLASS} /> }]
      : NAV_ITEMS;

  return (
    <RoleShell roleLabel="Guru" email={user.email ?? user.username ?? ""} navItems={navItems}>
      {children}
    </RoleShell>
  );
}
