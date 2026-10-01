import * as XLSX from "xlsx";

import { StudentRepository } from "@/server/repositories/student-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";
import { AttendanceRepository, type AttendanceUpsert } from "@/server/repositories/attendance-repository";
import { TeacherAttendanceRepository, type TeacherAttendanceUpsert } from "@/server/repositories/teacher-attendance-repository";
import type { AttendanceStatus } from "@/lib/db/schema";

export class AttendanceImportError extends Error {}

export type ImportTarget = "student" | "teacher";

export type FingerprintDay = {
  date: string; // col A, "DD/MM/YYYY"
  checkIn: string | null; // col E, "HH.MM"
  lateDuration: string | null; // col F
  checkOut: string | null; // col G, "HH.MM"
  masukKerja: "0" | "1"; // col J
  libur: "0" | "1"; // col K
  keterangan: string; // col L
};

export type FingerprintBlock = { fingerprintId: string; name: string; days: FingerprintDay[] };

export type ResolvedImportRow = { fingerprintId: string; personId: string; days: FingerprintDay[] };

const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;

function cellAt(row: unknown[], index: number): string | null {
  const v = row[index];
  if (v === undefined || v === null || v === "-" || v === "") return null;
  return String(v);
}

/**
 * Splits a fingerprint-machine export sheet into one block per person.
 * Verified against the real sample files (`docs/client_request/23September2026/{4.ss,5.sg}.xlsx`):
 * each block starts with a "Nama: X" row, its ID/Departemen/Posisi on the
 * next row, then a wrapped two-row table header ("Tanggal" marks the first
 * header row), then one row per day until a blank row / the next block.
 */
export function splitFingerprintBlocks(rows: unknown[][]): FingerprintBlock[] {
  const blocks: FingerprintBlock[] = [];
  let i = 0;

  while (i < rows.length) {
    const cellA = rows[i]?.[0];
    if (typeof cellA !== "string" || !cellA.startsWith("Nama:")) {
      i++;
      continue;
    }

    const name = cellA.slice("Nama:".length).trim();
    const idLine = rows[i + 1]?.[0];
    const idMatch = typeof idLine === "string" ? idLine.match(/^ID:\s*(\S+)/) : null;
    const fingerprintId = idMatch ? idMatch[1] : "";

    let j = i + 2;
    while (j < rows.length && rows[j]?.[0] !== "Tanggal") {
      const next = rows[j]?.[0];
      if (typeof next === "string" && next.startsWith("Nama:")) break;
      j++;
    }

    const days: FingerprintDay[] = [];
    if (rows[j]?.[0] === "Tanggal") {
      let k = j + 2; // header wraps across two rows
      while (k < rows.length) {
        const row = rows[k];
        const dateCell = row?.[0];
        if (typeof dateCell !== "string" || !DATE_RE.test(dateCell)) break;
        days.push({
          date: dateCell,
          checkIn: cellAt(row, 4),
          lateDuration: cellAt(row, 5),
          checkOut: cellAt(row, 6),
          masukKerja: row[9] === "1" ? "1" : "0",
          libur: row[10] === "1" ? "1" : "0",
          keterangan: row[11] == null ? "" : String(row[11]),
        });
        k++;
      }
      i = k;
    } else {
      i = j; // malformed block (no header found) — record it empty and move on
    }

    blocks.push({ fingerprintId, name, days });
  }

  return blocks;
}

/**
 * Pure status decision, resolved from the verified truth table (see
 * TSD-04): `libur` wins first (never persist a record for a scheduled
 * non-schoolday), then `masukKerja` (present, or late if a late-duration is
 * present), then `keterangan` text as a fallback for anything that isn't
 * literally "Alpha" — covers Izin/Sakit if a future export ever has them,
 * even though neither real sample file does.
 */
export function inferAttendanceStatus(day: FingerprintDay): AttendanceStatus | "skip" {
  if (day.libur === "1") return "skip";
  if (day.masukKerja === "1") return day.lateDuration ? "late" : "present";
  if (day.keterangan && day.keterangan.trim().toLowerCase() !== "alpha") return "excused";
  return "absent";
}

export function matchBlocksToPeople<T extends { id: string; fingerprintId: string | null }>(
  blocks: FingerprintBlock[],
  people: T[]
): { matched: { block: FingerprintBlock; personId: string }[]; unmatched: FingerprintBlock[] } {
  const byFingerprintId = new Map(
    people.filter((p): p is T & { fingerprintId: string } => !!p.fingerprintId).map((p) => [p.fingerprintId, p.id])
  );
  const matched: { block: FingerprintBlock; personId: string }[] = [];
  const unmatched: FingerprintBlock[] = [];
  for (const block of blocks) {
    const personId = block.fingerprintId ? byFingerprintId.get(block.fingerprintId) : undefined;
    if (personId) matched.push({ block, personId });
    else unmatched.push(block);
  }
  return { matched, unmatched };
}

function toIsoDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
}

function normalizeTime(value: string | null): string | undefined {
  return value ? value.replace(".", ":") : undefined;
}

function friendlyError(err: unknown): string {
  if (err instanceof Error && /unique/i.test(err.message)) {
    return "ID mesin fingerprint ini sudah digunakan oleh orang lain";
  }
  return err instanceof Error ? err.message : "Gagal memproses data ini";
}

export const AttendanceImportService = {
  async previewImport(target: ImportTarget, bytes: Uint8Array) {
    const workbook = XLSX.read(bytes, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new AttendanceImportError("File Excel kosong");
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: false });

    const blocks = splitFingerprintBlocks(rows);
    const people = target === "student" ? await StudentRepository.list() : await TeacherRepository.list();
    const matchable = people.map((p) => ({ id: p.id, fingerprintId: p.fingerprintId }));
    const { matched, unmatched } = matchBlocksToPeople(blocks, matchable);

    return {
      matched: matched.map((m) => ({
        fingerprintId: m.block.fingerprintId,
        name: m.block.name,
        personId: m.personId,
        dayCount: m.block.days.length,
        days: m.block.days,
      })),
      unmatched: unmatched.map((block) => ({
        fingerprintId: block.fingerprintId,
        name: block.name,
        dayCount: block.days.length,
        days: block.days,
      })),
      people: people.map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })),
    };
  },

  async confirmImport(target: ImportTarget, resolved: ResolvedImportRow[], importedByUserId: string) {
    const succeeded: { personId: string }[] = [];
    const failed: { personId: string; error: string }[] = [];

    for (const entry of resolved) {
      try {
        if (target === "student") {
          await StudentRepository.update(entry.personId, { fingerprintId: entry.fingerprintId });
          const student = await StudentRepository.findById(entry.personId);
          if (!student) throw new AttendanceImportError("Siswa tidak ditemukan");
          if (!student.currentClassId) throw new AttendanceImportError("Siswa belum memiliki kelas");

          const upserts: AttendanceUpsert[] = [];
          for (const day of entry.days) {
            const status = inferAttendanceStatus(day);
            if (status === "skip") continue;
            upserts.push({
              studentId: entry.personId,
              classId: student.currentClassId,
              date: toIsoDate(day.date),
              status,
              checkInTime: normalizeTime(day.checkIn),
              checkOutTime: normalizeTime(day.checkOut),
              importedByUserId,
            });
          }
          await AttendanceRepository.saveRegister(upserts);
        } else {
          await TeacherRepository.update(entry.personId, { fingerprintId: entry.fingerprintId });
          const teacher = await TeacherRepository.findById(entry.personId);
          if (!teacher) throw new AttendanceImportError("Guru tidak ditemukan");

          const upserts: TeacherAttendanceUpsert[] = [];
          for (const day of entry.days) {
            const status = inferAttendanceStatus(day);
            if (status === "skip") continue;
            upserts.push({
              teacherId: entry.personId,
              date: toIsoDate(day.date),
              status,
              checkInTime: normalizeTime(day.checkIn),
              checkOutTime: normalizeTime(day.checkOut),
              importedByUserId,
            });
          }
          await TeacherAttendanceRepository.saveRegister(upserts);
        }
        succeeded.push({ personId: entry.personId });
      } catch (err) {
        failed.push({ personId: entry.personId, error: friendlyError(err) });
      }
    }

    return { succeeded, failed };
  },
};
