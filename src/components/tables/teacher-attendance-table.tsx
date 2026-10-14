"use client";

import { useMemo, useState } from "react";

import type { AttendanceService } from "@/server/services/attendance-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ATTENDANCE_STATUS_LABELS, label } from "@/lib/labels";

type Row = Awaited<ReturnType<typeof AttendanceService.listTeacherAttendance>>[number];

export function TeacherAttendanceTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === "" ? rows : rows.filter((row) => row.teacherName.toLowerCase().includes(q));
  }, [rows, query]);

  const filterKey = query;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar query={query} onQueryChange={setQuery} searchPlaceholder="Cari nama guru..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guru</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Jam Masuk</TableHead>
            <TableHead>Jam Keluar</TableHead>
            <TableHead>Sumber</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row) => (
            <TableRow key={row.record.id}>
              <TableCell>{row.teacherName}</TableCell>
              <TableCell>{row.record.date}</TableCell>
              <TableCell>
                <Badge variant="secondary">{label(ATTENDANCE_STATUS_LABELS, row.record.status)}</Badge>
              </TableCell>
              <TableCell>{row.record.checkInTime ?? "-"}</TableCell>
              <TableCell>{row.record.checkOutTime ?? "-"}</TableCell>
              <TableCell>{row.record.importedByUserId ? "Impor fingerprint" : "Manual"}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada data kehadiran guru" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
