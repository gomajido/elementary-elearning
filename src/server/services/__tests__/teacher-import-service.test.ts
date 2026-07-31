import { describe, it, expect } from "vitest";

import { parseTeacherRows } from "@/server/services/teacher-import-service";

const HEADER = "email,firstName,lastName,employeeNumber,phone,hireDate";

function row(employeeNumber: string, email = "budi@example.com") {
  return `${email},Budi,Santoso,${employeeNumber},08123456789,2026-01-01`;
}

describe("parseTeacherRows", () => {
  it("accepts a valid row", () => {
    const csv = [HEADER, row("T001")].join("\n");
    const result = parseTeacherRows(csv, new Set(), new Set());
    expect(result.invalid).toEqual([]);
    expect(result.valid).toEqual([
      {
        rowNumber: 2,
        email: "budi@example.com",
        firstName: "Budi",
        lastName: "Santoso",
        employeeNumber: "T001",
        phone: "08123456789",
        hireDate: "2026-01-01",
      },
    ]);
  });

  it("rejects a row with an invalid email", () => {
    const csv = [HEADER, "not-an-email,Budi,Santoso,T002,,"].join("\n");
    const result = parseTeacherRows(csv, new Set(), new Set());
    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors.some((e) => e.includes("email"))).toBe(true);
  });

  it("flags an employeeNumber already used in the database", () => {
    const csv = [HEADER, row("T003")].join("\n");
    const result = parseTeacherRows(csv, new Set(["T003"]), new Set());
    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors).toContain("Nomor pegawai sudah digunakan");
  });

  it("flags an email already used in the database", () => {
    const csv = [HEADER, row("T004", "dupe@example.com")].join("\n");
    const result = parseTeacherRows(csv, new Set(), new Set(["dupe@example.com"]));
    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors).toContain("Email sudah digunakan");
  });

  it("flags a duplicate employeeNumber within the file itself", () => {
    const csv = [HEADER, row("T005", "a@example.com"), row("T005", "b@example.com")].join("\n");
    const result = parseTeacherRows(csv, new Set(), new Set());
    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain("Nomor pegawai duplikat dalam file");
  });
});
