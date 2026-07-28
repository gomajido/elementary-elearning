import type { Role } from "@/lib/db/schema";

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
};
