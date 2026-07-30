"use client";

import { useMemo, useState } from "react";

import type { AcademicService } from "@/server/services/academic-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AssignmentRow = Awaited<ReturnType<typeof AcademicService.listAssignmentsWithDetails>>[number];

export function ClassAssignmentsTable({ rows }: { rows: AssignmentRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter((row) =>
      `${row.teacherFirstName} ${row.teacherLastName} ${row.className} ${row.classSection ?? ""} ${row.subjectName}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  if (query !== lastQuery) {
    setLastQuery(query);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Cari guru, kelas, atau mata pelajaran..."
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guru</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Mata Pelajaran</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row) => (
            <TableRow key={row.assignment.id}>
              <TableCell>
                {row.teacherFirstName} {row.teacherLastName}
              </TableCell>
              <TableCell>
                {row.className}
                {row.classSection ? ` ${row.classSection}` : ""}
              </TableCell>
              <TableCell>{row.subjectName}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada penugasan" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
