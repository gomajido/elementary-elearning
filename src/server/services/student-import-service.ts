import Papa from "papaparse";

import { studentSchema } from "@/lib/validation/student";
import { StudentRepository } from "@/server/repositories/student-repository";
import { ClassRepository } from "@/server/repositories/academic-repository";
import type { GuardianInput } from "@/server/services/student-service";
import type { Gender } from "@/lib/db/schema";

const csvRowSchema = studentSchema.omit({ classId: true, academicYearId: true });

export type StudentImportRow = {
  rowNumber: number;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  classId: string;
  academicYearId: string;
  enrollmentDate: string;
  guardians: GuardianInput[];
};

export type StudentImportInvalidRow = { rowNumber: number; raw: Record<string, string>; errors: string[] };

export type ClassLookup = { id: string; name: string; section: string | null; academicYearId: string };

/**
 * Pure CSV-row validation — no DB access, so it's unit-testable directly.
 * `classesInYear` and `existingAdmissionNumbers` are pre-fetched by the caller.
 */
export function parseStudentRows(
  csvText: string,
  academicYearId: string,
  classesInYear: ClassLookup[],
  existingAdmissionNumbers: Set<string>,
): { valid: StudentImportRow[]; invalid: StudentImportInvalidRow[] } {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });

  const seenAdmissionNumbers = new Set<string>();
  const valid: StudentImportRow[] = [];
  const invalid: StudentImportInvalidRow[] = [];

  data.forEach((raw, i) => {
    const rowNumber = i + 2; // header is row 1
    const errors: string[] = [];

    const classRow = classesInYear.find(
      (c) =>
        c.name.trim().toLowerCase() === (raw.className ?? "").trim().toLowerCase() &&
        (c.section ?? "").trim().toLowerCase() === (raw.section ?? "").trim().toLowerCase(),
    );
    if (!classRow) {
      errors.push(`Kelas "${raw.className ?? ""}"${raw.section ? ` ${raw.section}` : ""} tidak ditemukan di tahun ajaran ini`);
    }

    const parsed = csvRowSchema.safeParse({
      admissionNumber: raw.admissionNumber,
      firstName: raw.firstName,
      lastName: raw.lastName,
      dateOfBirth: raw.dateOfBirth,
      gender: raw.gender,
      enrollmentDate: raw.enrollmentDate,
      guardian1FirstName: raw.guardian1FirstName,
      guardian1LastName: raw.guardian1LastName,
      guardian1Relationship: raw.guardian1Relationship,
      guardian1Phone: raw.guardian1Phone || undefined,
      guardian1Email: raw.guardian1Email || undefined,
      guardian2FirstName: raw.guardian2FirstName || undefined,
      guardian2LastName: raw.guardian2LastName || undefined,
      guardian2Relationship: raw.guardian2Relationship || undefined,
      guardian2Phone: raw.guardian2Phone || undefined,
      guardian2Email: raw.guardian2Email || undefined,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push(`${issue.path.join(".")}: ${issue.message}`);
    }

    if (parsed.success) {
      if (seenAdmissionNumbers.has(parsed.data.admissionNumber)) {
        errors.push("Nomor induk duplikat dalam file");
      }
      seenAdmissionNumbers.add(parsed.data.admissionNumber);
      if (existingAdmissionNumbers.has(parsed.data.admissionNumber)) {
        errors.push("Nomor induk sudah digunakan");
      }
    }

    if (!classRow || !parsed.success || errors.length > 0) {
      invalid.push({ rowNumber, raw, errors });
      return;
    }

    const guardians: GuardianInput[] = [
      {
        firstName: parsed.data.guardian1FirstName,
        lastName: parsed.data.guardian1LastName,
        relationshipType: parsed.data.guardian1Relationship,
        phone: parsed.data.guardian1Phone || undefined,
        email: parsed.data.guardian1Email || undefined,
        isPrimaryContact: true,
        isBillingContact: true,
      },
    ];
    if (parsed.data.guardian2FirstName && parsed.data.guardian2LastName && parsed.data.guardian2Relationship) {
      guardians.push({
        firstName: parsed.data.guardian2FirstName,
        lastName: parsed.data.guardian2LastName,
        relationshipType: parsed.data.guardian2Relationship,
        phone: parsed.data.guardian2Phone || undefined,
        email: parsed.data.guardian2Email || undefined,
        isPrimaryContact: false,
        isBillingContact: false,
      });
    }

    valid.push({
      rowNumber,
      admissionNumber: parsed.data.admissionNumber,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      classId: classRow.id,
      academicYearId,
      enrollmentDate: parsed.data.enrollmentDate,
      guardians,
    });
  });

  return { valid, invalid };
}

export const StudentImportService = {
  /** Fetches lookup data and delegates to the pure parseStudentRows. No DB writes. */
  async parseRows(csvText: string, academicYearId: string) {
    const [classRows, existingStudents] = await Promise.all([
      ClassRepository.listWithDetails(),
      StudentRepository.list(),
    ]);
    const classesInYear: ClassLookup[] = classRows
      .filter((c) => c.class.academicYearId === academicYearId)
      .map((c) => ({ id: c.class.id, name: c.class.name, section: c.class.section, academicYearId: c.class.academicYearId }));
    const existingAdmissionNumbers = new Set(existingStudents.map((s) => s.admissionNumber));

    return parseStudentRows(csvText, academicYearId, classesInYear, existingAdmissionNumbers);
  },
};
