import { describe, it, expect } from "vitest";

import { normalizeIndonesianPhone } from "@/lib/notifications/phone";

describe("normalizeIndonesianPhone", () => {
  it("converts a leading 0 to 62", () => {
    expect(normalizeIndonesianPhone("08123456789")).toBe("628123456789");
  });

  it("accepts an existing 62 prefix", () => {
    expect(normalizeIndonesianPhone("628123456789")).toBe("628123456789");
  });

  it("strips a + and other formatting characters", () => {
    expect(normalizeIndonesianPhone("+62 812-3456-789")).toBe("628123456789");
  });

  it("rejects a number with neither a 0 nor a 62 prefix", () => {
    expect(normalizeIndonesianPhone("123456789")).toBeNull();
  });

  it("rejects empty or non-numeric input", () => {
    expect(normalizeIndonesianPhone("")).toBeNull();
    expect(normalizeIndonesianPhone("abc")).toBeNull();
  });

  it("rejects a number that's implausibly short after normalization", () => {
    expect(normalizeIndonesianPhone("012")).toBeNull();
  });
});
