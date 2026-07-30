"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole, requireBaseRole } from "@/lib/auth/rbac";
import { AuthService, AuthError } from "@/server/services/auth-service";

export type UpdateAccountState = { error?: string; success?: boolean };

const updateAccountSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  username: z.string().min(3).optional().or(z.literal("")),
});

/** Admin editing any account's email/username — see AuthService.adminUpdateIdentity. */
export async function adminUpdateAccountAction(
  _prev: UpdateAccountState,
  formData: FormData
): Promise<UpdateAccountState> {
  await requireRole(["admin"]);

  const parsed = updateAccountSchema.safeParse({
    userId: formData.get("userId"),
    email: formData.get("email"),
    username: formData.get("username"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    await AuthService.adminUpdateIdentity(parsed.data.userId, {
      email: parsed.data.email || null,
      username: parsed.data.username || null,
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
  revalidatePath("/admin/accounts");
  return { success: true };
}

export type ResetPasswordState = { error?: string; tempPassword?: string };

/** Admin-forced password reset for any account — see AuthService.adminResetPassword. */
export async function adminResetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  await requireRole(["admin"]);
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return { error: "Input tidak valid" };

  try {
    const { tempPassword } = await AuthService.adminResetPassword(userId);
    // No revalidatePath — same reasoning as the grant-access flows: it
    // would swap this reveal UI away before the one-time password is seen.
    return { tempPassword };
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
}

/**
 * Grant/revoke further roles — restricted to *real* admins (requireBaseRole,
 * not requireRole) so a teacher granted admin access can't then grant
 * others or escalate further. See AuthService.grantAdmin/revokeAdmin.
 */
export async function grantAdminAccessAction(userId: string) {
  await requireBaseRole(["admin"]);
  await AuthService.grantAdmin(userId);
  revalidatePath("/admin/accounts");
}

export async function revokeAdminAccessAction(userId: string) {
  await requireBaseRole(["admin"]);
  await AuthService.revokeAdmin(userId);
  revalidatePath("/admin/accounts");
}
