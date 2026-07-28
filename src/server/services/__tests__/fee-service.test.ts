import { describe, it, expect } from "vitest";

import { summarizeInvoice } from "@/server/services/fee-service";

describe("summarizeInvoice", () => {
  it("is unpaid with no payments", () => {
    expect(summarizeInvoice(50000, [])).toEqual({ paidCents: 0, balanceCents: 50000, status: "unpaid" });
  });

  it("is partial when paid less than total", () => {
    expect(summarizeInvoice(50000, [20000])).toEqual({ paidCents: 20000, balanceCents: 30000, status: "partial" });
  });

  it("sums multiple payments", () => {
    expect(summarizeInvoice(50000, [20000, 30000])).toEqual({ paidCents: 50000, balanceCents: 0, status: "paid" });
  });

  it("is paid when balance reaches exactly zero", () => {
    expect(summarizeInvoice(10000, [10000])).toEqual({ paidCents: 10000, balanceCents: 0, status: "paid" });
  });

  it("treats overpayment as paid with a negative balance, not an error", () => {
    expect(summarizeInvoice(10000, [15000])).toEqual({ paidCents: 15000, balanceCents: -5000, status: "paid" });
  });
});
