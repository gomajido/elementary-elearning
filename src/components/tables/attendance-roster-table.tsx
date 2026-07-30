"use client";

import { useMemo, useState } from "react";

import type { AttendanceService } from "@/server/services/attendance-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ATTENDANCE_STATUS_LABELS, label } from "@/lib/labels";

type RosterRow = Awaited<ReturnType<typeof AttendanceService.rosterForClassAndDate>>[number];

export function AttendanceRosterTable({ rows }: { rows: RosterRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter(({ student }) => `${student.firstName} ${student.lastName}`.toLowerCase().includes(q));
  }, [rows, query]);

  if (query !== lastQuery) {
    setLastQuery(query);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar query={query} onQueryChange={setQuery} searchPlaceholder="Cari nama siswa..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Siswa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Catatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map(({ student, record }) => (
            <TableRow key={student.id}>
              <TableCell>
                {student.firstName} {student.lastName}
              </TableCell>
              <TableCell>{record ? label(ATTENDANCE_STATUS_LABELS, record.status) : "—"}</TableCell>
              <TableCell>{record?.notes ?? "—"}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Tidak ada siswa di kelas ini" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
