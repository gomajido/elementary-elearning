import { describe, it, expect } from "vitest";

import { teacherDapodikProfileSchema } from "@/lib/validation/teacher";

describe("teacherDapodikProfileSchema", () => {
  it("accepts an empty object — every field is optional, filled in progressively", () => {
    const result = teacherDapodikProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts a full valid profile matching the real Dapodik example", () => {
    const result = teacherDapodikProfileSchema.safeParse({
      placeOfBirth: "Kendari",
      dateOfBirth: "1990-02-04",
      motherName: "Agustina",
      nik: "7471014402000001",
      maritalStatus: "belum_kawin",
      employmentStatus: "gty_pty",
      salarySource: "yayasan",
      isActive: true,
      isHomeSchool: true,
      isPrincipalLicensed: false,
    });
    expect(result.success).toBe(true);
  });

  it("treats an unselected <select>'s empty string as not provided, not a literal enum value", () => {
    const result = teacherDapodikProfileSchema.safeParse({ maritalStatus: "", employmentStatus: "", salarySource: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maritalStatus).toBeUndefined();
      expect(result.data.employmentStatus).toBeUndefined();
      expect(result.data.salarySource).toBeUndefined();
    }
  });

  it("rejects an invalid enum value", () => {
    const result = teacherDapodikProfileSchema.safeParse({ employmentStatus: "not-a-real-status" });
    expect(result.success).toBe(false);
  });

  it("rejects a NIK that isn't 16 digits, but allows a blank one", () => {
    expect(teacherDapodikProfileSchema.safeParse({ nik: "123" }).success).toBe(false);
    expect(teacherDapodikProfileSchema.safeParse({ nik: "" }).success).toBe(true);
  });
});
