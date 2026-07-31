import Papa from "papaparse";

import { teacherSchema } from "@/lib/validation/teacher";
import { TeacherRepository } from "@/server/repositories/teacher-repository";
import { UserRepository } from "@/server/repositories/user-repository";

export type TeacherImportRow = {
  rowNumber: number;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  phone?: string;
  hireDate?: string;
};

export type TeacherImportInvalidRow = { rowNumber: number; raw: Record<string, string>; errors: string[] };

/**
 * Pure CSV-row validation — no DB access, so it's unit-testable directly.
 * `existingEmployeeNumbers`/`existingEmails` are pre-fetched by the caller.
 */
export function parseTeacherRows(
  csvText: string,
  existingEmployeeNumbers: Set<string>,
  existingEmails: Set<string>,
): { valid: TeacherImportRow[]; invalid: TeacherImportInvalidRow[] } {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });

  const seenEmployeeNumbers = new Set<string>();
  const seenEmails = new Set<string>();
  const valid: TeacherImportRow[] = [];
  const invalid: TeacherImportInvalidRow[] = [];

  data.forEach((raw, i) => {
    const rowNumber = i + 2; // header is row 1
    const errors: string[] = [];

    const parsed = teacherSchema.safeParse({
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      employeeNumber: raw.employeeNumber,
      phone: raw.phone || undefined,
      hireDate: raw.hireDate || undefined,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push(`${issue.path.join(".")}: ${issue.message}`);
      invalid.push({ rowNumber, raw, errors });
      return;
    }

    if (seenEmployeeNumbers.has(parsed.data.employeeNumber)) errors.push("Nomor pegawai duplikat dalam file");
    seenEmployeeNumbers.add(parsed.data.employeeNumber);
    if (existingEmployeeNumbers.has(parsed.data.employeeNumber)) errors.push("Nomor pegawai sudah digunakan");

    if (seenEmails.has(parsed.data.email)) errors.push("Email duplikat dalam file");
    seenEmails.add(parsed.data.email);
    if (existingEmails.has(parsed.data.email)) errors.push("Email sudah digunakan");

    if (errors.length > 0) {
      invalid.push({ rowNumber, raw, errors });
      return;
    }

    valid.push({ rowNumber, ...parsed.data });
  });

  return { valid, invalid };
}

export const TeacherImportService = {
  /** Fetches lookup data and delegates to the pure parseTeacherRows. No DB writes. */
  async parseRows(csvText: string) {
    const [existingTeachers, existingEmails] = await Promise.all([TeacherRepository.list(), UserRepository.listEmails()]);
    const existingEmployeeNumbers = new Set(existingTeachers.map((t) => t.employeeNumber));

    return parseTeacherRows(csvText, existingEmployeeNumbers, new Set(existingEmails));
  },
};
