import { describe, it, expect } from "vitest";

import { normalize, attemptDeadline, isPastGrace } from "@/server/services/quiz-service";

describe("normalize (short-answer auto-grading match)", () => {
  it("trims leading/trailing whitespace", () => {
    expect(normalize("  0.25  ")).toBe("0.25");
  });

  it("lowercases", () => {
    expect(normalize("Paris")).toBe("paris");
  });

  it("collapses internal whitespace runs to a single space", () => {
    expect(normalize("New   York")).toBe("new york");
  });

  it("treats differently-formatted equal answers as a match", () => {
    expect(normalize("  Photosynthesis ")).toBe(normalize("photosynthesis"));
  });

  it("does not treat different answers as a match", () => {
    expect(normalize("0.25")).not.toBe(normalize("0.2"));
  });
});

describe("attemptDeadline", () => {
  const startedAt = new Date("2026-07-30T10:00:00Z");

  it("is null for an untimed quiz", () => {
    expect(attemptDeadline(startedAt, null)).toBeNull();
  });

  it("is startedAt plus the limit", () => {
    expect(attemptDeadline(startedAt, 15)?.toISOString()).toBe("2026-07-30T10:15:00.000Z");
  });
});

describe("isPastGrace", () => {
  const startedAt = new Date("2026-07-30T10:00:00Z");
  const at = (iso: string) => new Date(iso);

  it("never expires an untimed quiz", () => {
    expect(isPastGrace(startedAt, null, at("2027-01-01T00:00:00Z"))).toBe(false);
  });

  it("is fine well inside the limit", () => {
    expect(isPastGrace(startedAt, 10, at("2026-07-30T10:05:00Z"))).toBe(false);
  });

  it("allows the auto-submit landing just after zero", () => {
    expect(isPastGrace(startedAt, 10, at("2026-07-30T10:10:02Z"))).toBe(false);
  });

  it("still allows a submit at the last moment of grace", () => {
    expect(isPastGrace(startedAt, 10, at("2026-07-30T10:11:00Z"))).toBe(false);
  });

  it("rejects once grace has elapsed", () => {
    expect(isPastGrace(startedAt, 10, at("2026-07-30T10:11:01Z"))).toBe(true);
  });

  it("rejects a tab left open for hours", () => {
    expect(isPastGrace(startedAt, 10, at("2026-07-30T14:00:00Z"))).toBe(true);
  });
});
