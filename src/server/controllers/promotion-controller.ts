"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { AcademicService } from "@/server/services/academic-service";

export async function promoteClassAction(input: Parameters<typeof AcademicService.promoteClassBulk>[0]) {
  await requireRole(["admin"]);

  const result = await AcademicService.promoteClassBulk(input);
  revalidatePath("/admin/students");
  revalidatePath("/admin/classes");
  return result;
}
