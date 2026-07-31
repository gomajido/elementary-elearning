import { describe, it, expect } from "vitest";

import { pickReminderChannel, buildReminderMessage } from "@/server/services/reminder-service";

describe("pickReminderChannel", () => {
  it("prefers WhatsApp when the phone normalizes successfully", () => {
    expect(pickReminderChannel({ phone: "08123456789", email: "guardian@example.com" })).toBe("whatsapp");
  });

  it("falls back to email when the phone is missing", () => {
    expect(pickReminderChannel({ phone: null, email: "guardian@example.com" })).toBe("email");
  });

  it("falls back to email when the phone doesn't normalize", () => {
    expect(pickReminderChannel({ phone: "not-a-phone", email: "guardian@example.com" })).toBe("email");
  });

  it("returns null when there's no usable contact at all", () => {
    expect(pickReminderChannel({ phone: null, email: null })).toBeNull();
    expect(pickReminderChannel({ phone: "not-a-phone", email: null })).toBeNull();
  });
});

describe("buildReminderMessage", () => {
  it("includes the student, invoice number, formatted balance, and due date", () => {
    const { subject, text } = buildReminderMessage({
      studentName: "Budi Santoso",
      invoiceNumber: "INV-2026-0001",
      balanceCents: 150000,
      dueDate: "2026-08-01",
    });
    expect(subject).toContain("INV-2026-0001");
    expect(text).toContain("Budi Santoso");
    expect(text).toContain("INV-2026-0001");
    expect(text).toContain("Rp1.500");
    expect(text).toContain("2026-08-01");
  });
});
