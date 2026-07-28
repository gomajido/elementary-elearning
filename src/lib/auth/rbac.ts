import { redirect } from "next/navigation";

import type { Role } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export class ForbiddenError extends Error {}

/** Call at the top of every protected page/layout/Server Action. */
export async function requireRole(allowed: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) throw new ForbiddenError(`Requires one of: ${allowed.join(", ")}`);
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
