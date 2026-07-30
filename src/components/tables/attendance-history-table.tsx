"use client";

import { useMemo, useState } from "react";

import type { AttendanceService } from "@/server/services/attendance-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ATTENDANCE_STATUS_LABELS, label } from "@/lib/labels";

type AttendanceRecord = Awaited<ReturnType<typeof AttendanceService.historyForStudent>>[number];

const STATUS_OPTIONS = Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function AttendanceHistoryTable({ rows }: { rows: AttendanceRecord[] }) {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [lastStatus, setLastStatus] = useState(status);

  const filtered = useMemo(() => {
    if (status === "all") return rows;
    return rows.filter((record) => record.status === status);
  }, [rows, status]);

  if (status !== lastStatus) {
    setLastStatus(status);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        filterValue={status}
        onFilterChange={setStatus}
        filterPlaceholder="Status"
        filterOptions={STATUS_OPTIONS}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Catatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.date}</TableCell>
              <TableCell>{label(ATTENDANCE_STATUS_LABELS, record.status)}</TableCell>
              <TableCell>{record.notes ?? "—"}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada catatan kehadiran" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
