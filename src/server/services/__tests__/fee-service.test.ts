import { describe, it, expect } from "vitest";

import { summarizeInvoice, selectLineItemsForStudent } from "@/server/services/fee-service";

function verified(amountCents: number) {
  return { amountCents, isVerified: true };
}

function unverified(amountCents: number) {
  return { amountCents, isVerified: false };
}

describe("summarizeInvoice", () => {
  it("is unpaid with no payments", () => {
    expect(summarizeInvoice(50000, [])).toEqual({
      paidCents: 0,
      balanceCents: 50000,
      status: "unpaid",
      hasPendingVerification: false,
    });
  });

  it("is partial when paid less than total", () => {
    expect(summarizeInvoice(50000, [verified(20000)])).toEqual({
      paidCents: 20000,
      balanceCents: 30000,
      status: "partial",
      hasPendingVerification: false,
    });
  });

  it("sums multiple payments", () => {
    expect(summarizeInvoice(50000, [verified(20000), verified(30000)])).toEqual({
      paidCents: 50000,
      balanceCents: 0,
      status: "paid",
      hasPendingVerification: false,
    });
  });

  it("is paid when balance reaches exactly zero", () => {
    expect(summarizeInvoice(10000, [verified(10000)])).toEqual({
      paidCents: 10000,
      balanceCents: 0,
      status: "paid",
      hasPendingVerification: false,
    });
  });

  it("treats overpayment as paid with a negative balance, not an error", () => {
    expect(summarizeInvoice(10000, [verified(15000)])).toEqual({
      paidCents: 15000,
      balanceCents: -5000,
      status: "paid",
      hasPendingVerification: false,
    });
  });

  it("excludes unverified payments from the balance entirely", () => {
    expect(summarizeInvoice(50000, [unverified(50000)])).toEqual({
      paidCents: 0,
      balanceCents: 50000,
      status: "unpaid",
      hasPendingVerification: true,
    });
  });

  it("counts only the verified portion when both verified and unverified payments exist", () => {
    expect(summarizeInvoice(50000, [verified(20000), unverified(30000)])).toEqual({
      paidCents: 20000,
      balanceCents: 30000,
      status: "partial",
      hasPendingVerification: true,
    });
  });

  it("flips to paid once an unverified payment covering the rest gets verified", () => {
    expect(summarizeInvoice(50000, [verified(20000), verified(30000)])).toEqual({
      paidCents: 50000,
      balanceCents: 0,
      status: "paid",
      hasPendingVerification: false,
    });
  });
});

describe("selectLineItemsForStudent", () => {
  const fullDayOnly = { id: "s-full", name: "SPP Full Day", amountCents: 100000, dayType: "full_day" as const };
  const halfDayOnly = { id: "s-half", name: "SPP Half Day", amountCents: 70000, dayType: "half_day" as const };
  const appliesToBoth = { id: "s-both", name: "Uang Kegiatan", amountCents: 20000, dayType: null };
  const structures = [fullDayOnly, halfDayOnly, appliesToBoth];
  const selectedIds = [fullDayOnly.id, halfDayOnly.id, appliesToBoth.id];

  it("gives a full_day student only the full_day and dayType-null structures", () => {
    const result = selectLineItemsForStudent(structures, selectedIds, "full_day");
    expect(result.map((r) => r.feeStructureId)).toEqual([fullDayOnly.id, appliesToBoth.id]);
  });

  it("gives a half_day student only the half_day and dayType-null structures", () => {
    const result = selectLineItemsForStudent(structures, selectedIds, "half_day");
    expect(result.map((r) => r.feeStructureId)).toEqual([halfDayOnly.id, appliesToBoth.id]);
  });

  it("excludes a structure not in feeStructureIds even if the dayType matches", () => {
    const result = selectLineItemsForStudent(structures, [halfDayOnly.id], "full_day");
    expect(result).toEqual([]);
  });

  it("returns an empty array when nothing matches", () => {
    const result = selectLineItemsForStudent([fullDayOnly], [fullDayOnly.id], "half_day");
    expect(result).toEqual([]);
  });
});
