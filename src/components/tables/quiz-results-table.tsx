"use client";

import { useMemo, useState } from "react";

import type { QuizService } from "@/server/services/quiz-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QUIZ_ATTEMPT_STATUS_LABELS, label } from "@/lib/labels";

type Result = Awaited<ReturnType<typeof QuizService.resultsForQuiz>>[number];

export function QuizResultsTable({ rows }: { rows: Result[] }) {
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
            <TableHead>Nilai</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map(({ attempt, student }) => (
            <TableRow key={attempt.id}>
              <TableCell>
                {student.firstName} {student.lastName}
              </TableCell>
              <TableCell>
                {attempt.totalScore ?? "—"} / {attempt.maxPossibleScore}
              </TableCell>
              <TableCell>{label(QUIZ_ATTEMPT_STATUS_LABELS, attempt.status)}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada percobaan" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
