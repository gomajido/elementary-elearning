import { describe, it, expect } from "vitest";

import { summarizeInvoice } from "@/server/services/fee-service";

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
