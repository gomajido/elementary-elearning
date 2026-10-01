import { describe, it, expect } from "vitest";

import { registrationApplicationSchema } from "@/lib/validation/registration";

function validApplication() {
  return {
    fullName: "Ahmad Hammam Naufal Zaim",
    gender: "male",
    nisn: "3191385710",
    nik: "7471092202190002",
    placeOfBirth: "Kendari",
    dateOfBirth: "2019-02-22",
    religion: "Islam",
    specialNeeds: "Tidak ada",
    addressDetail: "Jl R Suprapto",
    rt: "0",
    rw: "0",
    kelurahan: "Punggolaka",
    kecamatan: "Puuwatu",
    kabupaten: "Kendari",
    provinsi: "Sulawesi Tenggara",
    transportMode: "Sepeda motor",
    livingArrangement: "Bersama orang tua",
    birthCertNumber: "7471-LU-12042019-0001",
    fatherName: "Narno",
    fatherBirthYear: "1988",
    fatherSpecialNeeds: "Tidak ada",
    fatherOccupation: "Wiraswasta",
    fatherEducationLevel: "SMA / sederajat",
    fatherMonthlyIncome: "Rp. 2,000,000 - Rp. 4,999,999",
    motherName: "Risdayanti",
    motherBirthYear: "1992",
    motherSpecialNeeds: "Tidak ada",
    motherOccupation: "Tidak bekerja",
    motherEducationLevel: "S1",
    motherMonthlyIncome: "Tidak Berpenghasilan",
    heightCm: "114",
    weightKg: "19",
    distanceToSchoolKm: "2",
    travelTimeMinutes: "10",
    siblingCount: "0",
  };
}

describe("registrationApplicationSchema", () => {
  it("accepts a full valid submission matching the real Dapodik example", () => {
    const result = registrationApplicationSchema.safeParse(validApplication());
    expect(result.success).toBe(true);
  });

  it("rejects when a mandatory section-A field is missing", () => {
    const app: Record<string, unknown> = validApplication();
    delete app.fullName;
    const result = registrationApplicationSchema.safeParse(app);
    expect(result.success).toBe(false);
  });

  it("rejects when father's data (a mandatory section) is missing", () => {
    const app: Record<string, unknown> = validApplication();
    delete app.fatherOccupation;
    const result = registrationApplicationSchema.safeParse(app);
    expect(result.success).toBe(false);
  });

  it("succeeds without any wali (guardian) data — the one non-mandatory section", () => {
    const result = registrationApplicationSchema.safeParse(validApplication());
    expect(result.success).toBe(true);
  });

  it("succeeds without the jenjang-sebelumnya fields (new entrant, no prior school)", () => {
    const app = validApplication();
    expect("certificateSerialNumber" in app).toBe(false);
    const result = registrationApplicationSchema.safeParse(app);
    expect(result.success).toBe(true);
  });

  it("rejects a NIK that isn't 16 digits", () => {
    const result = registrationApplicationSchema.safeParse({ ...validApplication(), nik: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid gender value", () => {
    const result = registrationApplicationSchema.safeParse({ ...validApplication(), gender: "other" });
    expect(result.success).toBe(false);
  });
});
