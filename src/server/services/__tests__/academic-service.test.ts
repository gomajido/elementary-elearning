import { describe, it, expect } from "vitest";

import { resolvePromotionAction, type PromotionOverride } from "@/server/services/academic-service";

const DEFAULT_CLASS = "class-default";

function overridesMap(overrides: PromotionOverride[]) {
  return new Map(overrides.map((o) => [o.studentId, o]));
}

describe("resolvePromotionAction", () => {
  it("promotes into the default class when there is no override", () => {
    const result = resolvePromotionAction("student-1", overridesMap([]), DEFAULT_CLASS);
    expect(result).toEqual({ action: "promote", toClassId: DEFAULT_CLASS });
  });

  it("promotes into a custom class when explicitly overridden", () => {
    const overrides = overridesMap([{ studentId: "student-1", action: "promote", toClassId: "class-custom" }]);
    const result = resolvePromotionAction("student-1", overrides, DEFAULT_CLASS);
    expect(result).toEqual({ action: "promote", toClassId: "class-custom" });
  });

  it("repeats into the given target class", () => {
    const overrides = overridesMap([{ studentId: "student-1", action: "repeat", toClassId: "class-repeat" }]);
    const result = resolvePromotionAction("student-1", overrides, DEFAULT_CLASS);
    expect(result).toEqual({ action: "repeat", toClassId: "class-repeat" });
  });

  it("errors when a repeat override has no target class", () => {
    const overrides = overridesMap([{ studentId: "student-1", action: "repeat" }]);
    const result = resolvePromotionAction("student-1", overrides, DEFAULT_CLASS);
    expect(result).toEqual({ error: "Kelas tujuan wajib diisi untuk siswa yang tinggal kelas" });
  });

  it("withdraws without needing a target class", () => {
    const overrides = overridesMap([{ studentId: "student-1", action: "withdraw" }]);
    const result = resolvePromotionAction("student-1", overrides, DEFAULT_CLASS);
    expect(result).toEqual({ action: "withdraw" });
  });
});
