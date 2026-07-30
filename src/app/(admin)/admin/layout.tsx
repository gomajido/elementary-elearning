import type { ReactNode } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCog,
  School,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  ListChecks,
  Wallet,
  Settings,
  ArrowLeftRight,
} from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { ROLE_HOME } from "@/lib/auth/roles";
import { ROLE_LABELS, label } from "@/lib/labels";
import { RoleShell, type RoleNavItem } from "@/components/layout/role-shell";

const ICON_CLASS = "size-4 shrink-0";

const NAV_ITEMS: RoleNavItem[] = [
  { href: "/admin/dashboard", label: "Beranda", icon: <LayoutDashboard className={ICON_CLASS} /> },
  { href: "/admin/students", label: "Siswa", icon: <GraduationCap className={ICON_CLASS} /> },
  { href: "/admin/guardians", label: "Wali", icon: <Users className={ICON_CLASS} /> },
  { href: "/admin/teachers", label: "Guru", icon: <UserCog className={ICON_CLASS} /> },
  { href: "/admin/classes", label: "Kelas", icon: <School className={ICON_CLASS} /> },
  { href: "/admin/assignments", label: "Penugasan", icon: <ListChecks className={ICON_CLASS} /> },
  { href: "/admin/subjects", label: "Mata Pelajaran", icon: <BookOpen className={ICON_CLASS} /> },
  { href: "/admin/academic-years", label: "Tahun Ajaran", icon: <CalendarRange className={ICON_CLASS} /> },
  { href: "/admin/attendance", label: "Kehadiran", icon: <ClipboardCheck className={ICON_CLASS} /> },
  { href: "/admin/fees", label: "Biaya", icon: <Wallet className={ICON_CLASS} /> },
  { href: "/admin/accounts", label: "Manajemen Akun", icon: <Settings className={ICON_CLASS} /> },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["admin"]);
  const primaryRole = user.roles[0];
  // Reached via a granted admin role, not their base role — offer a way back.
  const navItems =
    primaryRole !== "admin"
      ? [
          ...NAV_ITEMS,
          {
            href: ROLE_HOME[primaryRole],
            label: `Kembali ke Portal ${label(ROLE_LABELS, primaryRole)}`,
            icon: <ArrowLeftRight className={ICON_CLASS} />,
          },
        ]
      : NAV_ITEMS;

  return (
    <RoleShell roleLabel="Admin" email={user.email ?? user.username ?? ""} navItems={navItems}>
      {children}
    </RoleShell>
  );
}
