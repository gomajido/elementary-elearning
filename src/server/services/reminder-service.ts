import { normalizeIndonesianPhone } from "@/lib/notifications/phone";
import { sendEmail } from "@/lib/notifications/email-client";
import { sendWhatsAppMessage, buildWaMeLink } from "@/lib/notifications/whatsapp-client";
import { FeeService } from "@/server/services/fee-service";
import { StudentRepository } from "@/server/repositories/student-repository";
import { InvoiceReminderRepository } from "@/server/repositories/fee-repository";
import type { ReminderChannel } from "@/lib/db/schema";

export class ReminderError extends Error {}

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

/** WhatsApp if the guardian has a phone that normalizes to something plausible, else email, else nothing to send to. */
export function pickReminderChannel(guardian: { phone: string | null; email: string | null }): "whatsapp" | "email" | null {
  if (guardian.phone && normalizeIndonesianPhone(guardian.phone)) return "whatsapp";
  if (guardian.email) return "email";
  return null;
}

export function buildReminderMessage(input: {
  studentName: string;
  invoiceNumber: string;
  balanceCents: number;
  dueDate: string;
}) {
  const subject = `Pengingat Pembayaran — ${input.invoiceNumber}`;
  const text = [
    "Yth. Bapak/Ibu Wali,",
    "",
    `Kami ingin mengingatkan bahwa tagihan atas nama ${input.studentName} (No. Tagihan ${input.invoiceNumber}) sebesar ${formatCents(input.balanceCents)} jatuh tempo pada ${input.dueDate}.`,
    "",
    "Mohon segera melakukan pembayaran. Terima kasih.",
    "",
    "SD Madani",
  ].join("\n");
  return { subject, text };
}

export const ReminderService = {
  /** Every invoice with an outstanding balance, its resolved contact/channel, and its last reminder (if any). */
  async eligibleInvoices() {
    const outstanding = await FeeService.outstandingBalanceReport();
    const invoiceIds = outstanding.map((o) => o.invoice.id);

    const [latestReminders, guardiansByStudent] = await Promise.all([
      InvoiceReminderRepository.listLatestByInvoiceIds(invoiceIds),
      Promise.all(outstanding.map((o) => StudentRepository.listGuardiansForStudent(o.student.id))),
    ]);

    return outstanding.map((o, i) => {
      const guardianRows = guardiansByStudent[i];
      const billingContact = guardianRows.find((g) => g.link.isBillingContact) ?? guardianRows[0];
      const guardian = billingContact?.guardian ?? null;
      const channel = guardian ? pickReminderChannel(guardian) : null;
      const studentName = `${o.student.firstName} ${o.student.lastName}`;

      // Precomputed server-side (not built on click) so the client can render a
      // real <a href> — a script-triggered window.open() after an awaited server
      // action is exactly the pattern popup blockers are designed to catch.
      const waLink =
        channel === "whatsapp"
          ? buildWaMeLink(
              normalizeIndonesianPhone(guardian!.phone!)!,
              buildReminderMessage({ studentName, invoiceNumber: o.invoice.invoiceNumber, balanceCents: o.balanceCents, dueDate: o.invoice.dueDate }).text
            )
          : null;

      return {
        invoice: o.invoice,
        student: o.student,
        balanceCents: o.balanceCents,
        guardian,
        channel,
        waLink,
        lastReminder: latestReminders.get(o.invoice.id) ?? null,
      };
    });
  },

  /** Each invoice is independent — one failure (bad WAHA session, SMTP hiccup) doesn't block the rest of the batch. */
  async sendReminders(invoiceIds: string[]) {
    const eligible = await ReminderService.eligibleInvoices();
    const byInvoiceId = new Map(eligible.map((e) => [e.invoice.id, e]));

    const succeeded: { invoiceNumber: string; studentName: string; channel: ReminderChannel }[] = [];
    const failed: { invoiceNumber: string; studentName: string; error: string }[] = [];

    for (const invoiceId of invoiceIds) {
      const row = byInvoiceId.get(invoiceId);
      const studentName = row ? `${row.student.firstName} ${row.student.lastName}` : "";
      if (!row || !row.guardian || !row.channel) {
        failed.push({ invoiceNumber: row?.invoice.invoiceNumber ?? invoiceId, studentName, error: "Tidak ada kontak yang bisa dihubungi" });
        continue;
      }

      const { subject, text } = buildReminderMessage({
        studentName,
        invoiceNumber: row.invoice.invoiceNumber,
        balanceCents: row.balanceCents,
        dueDate: row.invoice.dueDate,
      });

      try {
        if (row.channel === "whatsapp") {
          await sendWhatsAppMessage(normalizeIndonesianPhone(row.guardian.phone!)!, text);
        } else {
          await sendEmail(row.guardian.email!, subject, text);
        }
        await InvoiceReminderRepository.create({ invoiceId, guardianId: row.guardian.id, channel: row.channel, status: "sent" });
        succeeded.push({ invoiceNumber: row.invoice.invoiceNumber, studentName, channel: row.channel });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Gagal mengirim";
        await InvoiceReminderRepository.create({ invoiceId, guardianId: row.guardian.id, channel: row.channel, status: "failed", errorMessage });
        failed.push({ invoiceNumber: row.invoice.invoiceNumber, studentName, error: errorMessage });
      }
    }

    return { succeeded, failed };
  },

  /**
   * Single-parent path: the client renders `eligibleInvoices()`'s precomputed
   * `waLink` as a real `<a href target="_blank">` — clicking it opens the
   * admin's own WhatsApp (browser or phone app) with the message prefilled,
   * and they send it themselves; no WAHA session involved. This just logs
   * that click to `invoiceReminders`, fire-and-forget from the client (see
   * reminder-table.tsx) so the log call can't block or interfere with the
   * anchor's native navigation. Same "avoid blind re-sends" purpose as the
   * bulk path (see schema comment), and just as honest a "sent" signal as
   * the bulk path's "WAHA accepted it" (neither confirms actual delivery).
   */
  async logWaReminderSent(invoiceId: string) {
    const eligible = await ReminderService.eligibleInvoices();
    const row = eligible.find((e) => e.invoice.id === invoiceId);
    if (!row || !row.guardian || row.channel !== "whatsapp") {
      throw new ReminderError("Tidak ada nomor WhatsApp yang bisa dihubungi untuk tagihan ini");
    }
    await InvoiceReminderRepository.create({ invoiceId, guardianId: row.guardian.id, channel: "whatsapp", status: "sent" });
  },
};
