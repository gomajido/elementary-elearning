import { describe, it, expect } from "vitest";

import { parseStudentRows, type ClassLookup } from "@/server/services/student-import-service";

const YEAR_ID = "year-1";

const classes: ClassLookup[] = [{ id: "class-1", name: "Primary 3", section: "A", academicYearId: YEAR_ID }];

const HEADER =
  "admissionNumber,firstName,lastName,dateOfBirth,gender,className,section,enrollmentDate,guardian1FirstName,guardian1LastName,guardian1Relationship,guardian1Phone,guardian1Email";

function row(admissionNumber: string, firstName = "Budi") {
  return `${admissionNumber},${firstName},Santoso,2015-01-01,male,Primary 3,A,2026-01-01,Siti,Santoso,mother,08123456789,siti@example.com`;
}

describe("parseStudentRows", () => {
  it("accepts a valid row", () => {
    const csv = [HEADER, row("A001")].join("\n");
    const result = parseStudentRows(csv, YEAR_ID, classes, new Set());
    expect(result.invalid).toEqual([]);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]).toMatchObject({ admissionNumber: "A001", classId: "class-1", academicYearId: YEAR_ID });
    expect(result.valid[0].guardians).toHaveLength(1);
  });

  it("rejects a row missing a required field", () => {
    const csv = [HEADER, ",Budi,Santoso,2015-01-01,male,Primary 3,A,2026-01-01,Siti,Santoso,mother,,"].join("\n");
    const result = parseStudentRows(csv, YEAR_ID, classes, new Set());
    expect(result.valid).toEqual([]);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors.some((e) => e.includes("admissionNumber"))).toBe(true);
  });

  it("flags a class that doesn't exist in the given academic year", () => {
    const csv = [HEADER, "A002,Budi,Santoso,2015-01-01,male,Primary 9,Z,2026-01-01,Siti,Santoso,mother,,"].join("\n");
    const result = parseStudentRows(csv, YEAR_ID, classes, new Set());
    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors[0]).toMatch(/tidak ditemukan/);
  });

  it("flags an admissionNumber already used in the database", () => {
    const csv = [HEADER, row("A003")].join("\n");
    const result = parseStudentRows(csv, YEAR_ID, classes, new Set(["A003"]));
    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors).toContain("Nomor induk sudah digunakan");
  });

  it("flags a duplicate admissionNumber within the file itself", () => {
    const csv = [HEADER, row("A004"), row("A004")].join("\n");
    const result = parseStudentRows(csv, YEAR_ID, classes, new Set());
    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain("Nomor induk duplikat dalam file");
  });
});
