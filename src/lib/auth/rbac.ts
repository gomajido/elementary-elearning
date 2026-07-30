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
  if (!allowed.some((r) => user.roles.includes(r))) redirect(ROLE_HOME[user.roles[0]]);
  return user;
}

/**
 * Like requireRole, but checks only the *primary* role (roles[0]), ignoring
 * any granted-on-top roles — e.g. a teacher granted admin access still
 * fails requireBaseRole(["admin"]). Use for actions that must be
 * restricted to real admins, such as granting/revoking further roles
 * (see account-controller.ts) — otherwise a granted admin could escalate
 * further or grant others.
 */
export async function requireBaseRole(allowed: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.roles[0])) redirect(ROLE_HOME[user.roles[0]]);
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
