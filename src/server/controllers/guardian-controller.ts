"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { GuardianService, GuardianPortalError } from "@/server/services/guardian-service";
import { GUARDIAN_RELATIONSHIP_TYPES } from "@/lib/db/schema";

export type GrantAccessState = {
  error?: string;
  tempPassword?: string;
  username?: string;
  email?: string;
  guardianId?: string;
};

const grantAccessSchema = z.object({
  guardianId: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
});

export async function grantPortalAccessAction(_prev: GrantAccessState, formData: FormData): Promise<GrantAccessState> {
  await requireRole(["admin"]);
  const parsed = grantAccessSchema.safeParse({
    guardianId: formData.get("guardianId"),
    email: formData.get("email") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    const { tempPassword, username } = await GuardianService.grantPortalAccess(
      parsed.data.guardianId,
      parsed.data.email || undefined
    );
    // No revalidatePath here: this action re-renders per-row (a Server
    // Component swaps this form for an "Active" badge once guardian.userId
    // is set), which would unmount the one-time temp-password display
    // before it's seen. The list picks up the new state on next natural
    // navigation instead — same tradeoff as the teacher-creation flow.
    return { tempPassword, username, email: parsed.data.email, guardianId: parsed.data.guardianId };
  } catch (err) {
    if (err instanceof GuardianPortalError) return { error: err.message, guardianId: parsed.data.guardianId };
    throw err;
  }
}

export type UpdateGuardianState = { error?: string };

const updateGuardianSchema = z.object({
  guardianId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  relationshipType: z.enum(GUARDIAN_RELATIONSHIP_TYPES),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export async function updateGuardianAction(_prev: UpdateGuardianState, formData: FormData): Promise<UpdateGuardianState> {
  await requireRole(["admin"]);
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateGuardianSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const { guardianId, ...input } = parsed.data;

  await GuardianService.updateGuardian(guardianId, {
    ...input,
    phone: input.phone || undefined,
    email: input.email || undefined,
    address: input.address || undefined,
  });
  revalidatePath("/admin/guardians");
  return {};
}

export async function deleteGuardianAction(guardianId: string) {
  await requireRole(["admin"]);
  await GuardianService.deleteGuardian(guardianId);
  revalidatePath("/admin/guardians");
}
