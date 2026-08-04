"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { GradeService } from "@/server/services/grade-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type GradebookRow = Awaited<ReturnType<typeof GradeService.gradebookForCourse>>[number];

export function GradebookTable({ rows }: { rows: GradebookRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter((row) => `${row.student.firstName} ${row.student.lastName}`.toLowerCase().includes(q));
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
            <TableHead>Tugas</TableHead>
            <TableHead>Kuis</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row) => (
            <TableRow key={row.student.id}>
              <TableCell>
                {row.student.firstName} {row.student.lastName}
              </TableCell>
              <TableCell>{row.assignmentMax > 0 ? `${row.assignmentTotal} / ${row.assignmentMax}` : "—"}</TableCell>
              <TableCell>{row.quizMax > 0 ? `${row.quizTotal} / ${row.quizMax}` : "—"}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/teacher/students/${row.student.id}/report-card`} />}>
                  Rapor
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
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
