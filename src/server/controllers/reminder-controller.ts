"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { ReminderService } from "@/server/services/reminder-service";

export async function sendRemindersAction(invoiceIds: string[]) {
  await requireRole(["admin"]);
  const result = await ReminderService.sendReminders(invoiceIds);
  revalidatePath("/admin/fees/reminders");
  return result;
}
