import { describe, it, expect } from "vitest";

import { normalize } from "@/server/services/quiz-service";

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
