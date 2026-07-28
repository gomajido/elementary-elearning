import { redirect } from "next/navigation";

import type { Role } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";

/**
 * Call at the top of every protected page/layout/Server Action. A role
 * mismatch (e.g. a teacher session hitting an /admin/* URL — middleware
 * only checks "logged in", not "correct role", see RFC 0001 "Auth Design")
 * redirects to that user's own dashboard rather than throwing, so a stale
 * bookmark or mistyped URL doesn't crash to a raw 500.
 */
export async function requireRole(allowed: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
