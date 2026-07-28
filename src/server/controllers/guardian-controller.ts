"use server";

import { z } from "zod";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService, GuardianPortalError } from "@/server/services/guardian-service";

export type GrantAccessState = { error?: string; tempPassword?: string; email?: string; guardianId?: string };

const grantAccessSchema = z.object({
  guardianId: z.string().min(1),
  email: z.string().email(),
});

export async function grantPortalAccessAction(_prev: GrantAccessState, formData: FormData): Promise<GrantAccessState> {
  await requireRole(["admin"]);
  const parsed = grantAccessSchema.safeParse({
    guardianId: formData.get("guardianId"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    const { tempPassword } = await GuardianService.grantPortalAccess(parsed.data.guardianId, parsed.data.email);
    // No revalidatePath here: this action re-renders per-row (a Server
    // Component swaps this form for an "Active" badge once guardian.userId
    // is set), which would unmount the one-time temp-password display
    // before it's seen. The list picks up the new state on next natural
    // navigation instead — same tradeoff as the teacher-creation flow.
    return { tempPassword, email: parsed.data.email, guardianId: parsed.data.guardianId };
  } catch (err) {
    if (err instanceof GuardianPortalError) return { error: err.message, guardianId: parsed.data.guardianId };
    throw err;
  }
}
