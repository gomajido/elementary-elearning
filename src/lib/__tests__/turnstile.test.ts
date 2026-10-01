import { describe, it, expect, vi, afterEach } from "vitest";

import { verifyTurnstileToken } from "@/lib/turnstile";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyTurnstileToken", () => {
  it("returns true when siteverify reports success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    );
    expect(await verifyTurnstileToken("token")).toBe(true);
  });

  it("returns false when siteverify reports failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }) })
    );
    expect(await verifyTurnstileToken("token")).toBe(false);
  });

  it("fails closed on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    expect(await verifyTurnstileToken("token")).toBe(false);
  });

  it("fails closed when the network request throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );
    expect(await verifyTurnstileToken("token")).toBe(false);
  });

  it("fails closed for an empty token without even calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await verifyTurnstileToken("")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
