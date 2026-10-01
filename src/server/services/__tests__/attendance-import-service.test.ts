import { describe, it, expect } from "vitest";

import {
  splitFingerprintBlocks,
  inferAttendanceStatus,
  matchBlocksToPeople,
  type FingerprintDay,
} from "@/server/services/attendance-import-service";

// Layout lifted from the real sample files (docs/client_request/23September2026/{4.ss,5.sg}.xlsx),
// verified by parsing the actual sheet XML: title/period rows, "Nama:" + "ID: N | ..." rows,
// a blank row, summary-stat filler rows, a blank row, a wrapped two-row header ("Tanggal" marks
// the first header row), then one row per day (12 columns A-L) until a blank row.
const HEADER_ROW_1 = ["Tanggal", "Hari", "Ketentuan", "5", "", "7", "", "", "", "Masuk Kerja", "Libur", "Keterangan"];
const HEADER_ROW_2 = ["29", "", "", "Pulang", "Absensi Masuk", "Terlambat", "Absensi Pulang", "Pulang Cepat", "", "", "", ""];

const FIXTURE_ROWS: unknown[][] = [
  ["LAPORAN RINCIAN HARIAN"],
  ["Periode: 01-08-2026 s/d 31-08-2026"],
  ["Nama: Test Satu"],
  ["ID: 9 | Departemen: Office | Posisi: Siswa SD"],
  [],
  ["Rekap Absensi Pegawai"],
  ["Kehadiran", ": 2", "Durasi Kerja", ": 11:43", "Pulang Awal", ": 0:00", "Tidak Absen Masuk", ": 0", "Alpha", ": 1"],
  ["Presentase Kehadiran", ": 50%"],
  ["Datang Terlambat", ": 0:06 (1)"],
  [],
  HEADER_ROW_1,
  HEADER_ROW_2,
  ["01/08/2026", "Sabtu", "-", "-", "-", "-", "-", "-", "-", "0", "1", "Libur Rutin"],
  ["03/08/2026", "Senin", "07.00", "12.55", "-", "-", "-", "-", "-", "0", "0", "Alpha"],
  ["04/08/2026", "Selasa", "07.00", "12.55", "06.59", "-", "-", "-", "05.55", "1", "0", ""],
  ["05/08/2026", "Rabu", "07.00", "12.55", "07.06", "00.06", "-", "-", "05.48", "1", "0", ""],
  [],
  [],
  ["LAPORAN RINCIAN HARIAN"],
  ["Periode: 01-08-2026 s/d 31-08-2026"],
  ["Nama: Test Dua"],
  ["ID: 10 | Departemen: Office | Posisi: Siswa SD"],
  [],
  ["Rekap Absensi Pegawai"],
  ["Kehadiran", ": 0"],
  ["Presentase Kehadiran", ": 0%"],
  ["Datang Terlambat", ": 0:00 (0)"],
  [],
  HEADER_ROW_1,
  HEADER_ROW_2,
  ["02/08/2026", "Minggu", "-", "-", "-", "-", "-", "-", "-", "0", "1", "Libur Rutin"],
];

describe("splitFingerprintBlocks", () => {
  it("splits the sheet into one block per person with fingerprintId, name, and days", () => {
    const blocks = splitFingerprintBlocks(FIXTURE_ROWS);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ fingerprintId: "9", name: "Test Satu" });
    expect(blocks[0].days).toHaveLength(4);
    expect(blocks[1]).toMatchObject({ fingerprintId: "10", name: "Test Dua" });
    expect(blocks[1].days).toHaveLength(1);
  });

  it("parses each day's columns correctly (libur, absent, present, late)", () => {
    const [block] = splitFingerprintBlocks(FIXTURE_ROWS);
    const [libur, alpha, present, late] = block.days;

    expect(libur).toMatchObject({ date: "01/08/2026", libur: "1", masukKerja: "0", keterangan: "Libur Rutin" });
    expect(alpha).toMatchObject({ date: "03/08/2026", libur: "0", masukKerja: "0", keterangan: "Alpha" });
    expect(present).toMatchObject({ date: "04/08/2026", masukKerja: "1", checkIn: "06.59", lateDuration: null });
    expect(late).toMatchObject({ date: "05/08/2026", masukKerja: "1", checkIn: "07.06", lateDuration: "00.06" });
  });

  it("handles ragged day counts across blocks without dropping either block", () => {
    const blocks = splitFingerprintBlocks(FIXTURE_ROWS);
    expect(blocks.map((b) => b.days.length)).toEqual([4, 1]);
  });
});

function day(overrides: Partial<FingerprintDay>): FingerprintDay {
  return { date: "01/08/2026", checkIn: null, lateDuration: null, checkOut: null, masukKerja: "0", libur: "0", keterangan: "", ...overrides };
}

describe("inferAttendanceStatus", () => {
  it("skips scheduled holidays regardless of keterangan text", () => {
    expect(inferAttendanceStatus(day({ libur: "1", keterangan: "Libur Rutin" }))).toBe("skip");
  });

  it("is present when masukKerja=1 with no late duration", () => {
    expect(inferAttendanceStatus(day({ masukKerja: "1", checkIn: "06.59" }))).toBe("present");
  });

  it("is late when masukKerja=1 with a late duration", () => {
    expect(inferAttendanceStatus(day({ masukKerja: "1", checkIn: "07.06", lateDuration: "00.06" }))).toBe("late");
  });

  it("is absent when keterangan is Alpha", () => {
    expect(inferAttendanceStatus(day({ keterangan: "Alpha" }))).toBe("absent");
  });

  it("is absent when keterangan is blank and not attended", () => {
    expect(inferAttendanceStatus(day({ keterangan: "" }))).toBe("absent");
  });

  it("falls back to excused for a keterangan that isn't Alpha (e.g. a future Izin/Sakit export)", () => {
    expect(inferAttendanceStatus(day({ keterangan: "Izin" }))).toBe("excused");
  });
});

describe("matchBlocksToPeople", () => {
  const people = [
    { id: "student-1", fingerprintId: "9" },
    { id: "student-2", fingerprintId: null },
  ];

  it("matches a block to the person with the same fingerprintId", () => {
    const blocks = splitFingerprintBlocks(FIXTURE_ROWS);
    const { matched, unmatched } = matchBlocksToPeople(blocks, people);

    expect(matched).toEqual([{ block: blocks[0], personId: "student-1" }]);
    expect(unmatched).toEqual([blocks[1]]);
  });

  it("leaves everything unmatched when no fingerprintId lines up", () => {
    const blocks = splitFingerprintBlocks(FIXTURE_ROWS);
    const { matched, unmatched } = matchBlocksToPeople(blocks, [{ id: "student-3", fingerprintId: "999" }]);

    expect(matched).toEqual([]);
    expect(unmatched).toEqual(blocks);
  });
});
