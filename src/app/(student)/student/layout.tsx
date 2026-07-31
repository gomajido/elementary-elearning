import type { ReactNode } from "react";
import { Home, BookOpen, Award, ShieldCheck } from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { StudentShell, type StudentNavItem } from "@/components/layout/student-shell";

const NAV_ITEMS: StudentNavItem[] = [
  { href: "/student/dashboard", label: "Beranda", icon: <Home className="size-6" />, color: "sky" },
  { href: "/student/courses", label: "Kursus", icon: <BookOpen className="size-6" />, color: "violet" },
  { href: "/student/grades", label: "Nilai", icon: <Award className="size-6" />, color: "amber" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["student"]);
  const navItems =
    user.roles[0] !== "admin" && user.roles.includes("admin")
      ? [
          ...NAV_ITEMS,
          { href: "/admin/dashboard", label: "Portal Admin", icon: <ShieldCheck className="size-6" />, color: "rose" as const },
        ]
      : NAV_ITEMS;

  return (
    <StudentShell email={user.email ?? user.username ?? ""} navItems={navItems}>
      {children}
    </StudentShell>
  );
}
