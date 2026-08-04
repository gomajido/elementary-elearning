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

/** Single-parent path — logs that the admin opened the wa.me link for this invoice (see reminder-table.tsx: fire-and-forget, doesn't block the anchor's navigation). */
export async function logWaReminderSentAction(invoiceId: string) {
  await requireRole(["admin"]);
  await ReminderService.logWaReminderSent(invoiceId);
  revalidatePath("/admin/fees/reminders");
}
