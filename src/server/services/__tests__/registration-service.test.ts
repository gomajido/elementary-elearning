import { describe, it, expect } from "vitest";

import { buildDapodikExportRow } from "@/server/services/registration-service";

const student = {
  admissionNumber: "2026-0001",
  firstName: "Ahmad",
  lastName: "Zaim",
  dateOfBirth: "2019-02-22",
  gender: "male",
};

const application = {
  nisn: "3191385710",
  nik: "7471092202190002",
  placeOfBirth: "Kendari",
  religion: "Islam",
  specialNeeds: "Tidak ada",
  addressDetail: "Jl R Suprapto",
  rt: "0",
  rw: "0",
  kelurahan: "Punggolaka",
  kecamatan: "Puuwatu",
  kabupaten: "Kendari",
  provinsi: "Sulawesi Tenggara",
  fatherName: "Narno",
  fatherOccupation: "Wiraswasta",
  fatherEducationLevel: "SMA / sederajat",
  fatherMonthlyIncome: "Rp. 2,000,000 - Rp. 4,999,999",
  motherName: "Risdayanti",
  motherOccupation: "Tidak bekerja",
  motherEducationLevel: "S1",
  motherMonthlyIncome: "Tidak Berpenghasilan",
  guardianName: null,
  heightCm: 114,
  weightKg: 19,
};

describe("buildDapodikExportRow", () => {
  it("fills every Dapodik column from the application when one is attached", () => {
    const row = buildDapodikExportRow(student, application);
    expect(row["No. Induk"]).toBe("2026-0001");
    expect(row["Nama Lengkap"]).toBe("Ahmad Zaim");
    expect(row.NISN).toBe("3191385710");
    expect(row["Nama Ayah"]).toBe("Narno");
    expect(row["Penghasilan Ayah"]).toBe("Rp. 2,000,000 - Rp. 4,999,999");
    expect(row["Tinggi Badan (cm)"]).toBe("114");
  });

  it("leaves Dapodik columns blank (not undefined/crash) for an admin-created student with no application", () => {
    const row = buildDapodikExportRow(student, null);
    expect(row["No. Induk"]).toBe("2026-0001");
    expect(row.NISN).toBe("");
    expect(row["Nama Ayah"]).toBe("");
    expect(row["Tinggi Badan (cm)"]).toBe("");
  });
});
