"use client";

import { useMemo, useState } from "react";

import type { AssignmentService } from "@/server/services/assignment-service";
import { GradeSubmissionForm } from "@/components/forms/grade-submission-form";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SUBMISSION_STATUS_LABELS, label } from "@/lib/labels";

type Submission = Awaited<ReturnType<typeof AssignmentService.submissionsForAssignment>>[number];

export function SubmissionsTable({ rows, maxScore }: { rows: Submission[]; maxScore: number }) {
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
            <TableHead>Jawaban</TableHead>
            <TableHead>Nilai</TableHead>
            <TableHead>Penilaian</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map(({ submission, student }) => (
            <TableRow key={submission.id}>
              <TableCell>
                {student.firstName} {student.lastName}
              </TableCell>
              <TableCell>
                <Badge variant={submission.status === "graded" ? "secondary" : "outline"}>
                  {label(SUBMISSION_STATUS_LABELS, submission.status)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">{submission.textResponse ?? "—"}</TableCell>
              <TableCell>{submission.score ?? "—"}</TableCell>
              <TableCell>
                <GradeSubmissionForm submissionId={submission.id} maxScore={maxScore} />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada pengumpulan" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
