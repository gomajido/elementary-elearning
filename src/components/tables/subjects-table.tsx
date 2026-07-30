"use client";

import { useMemo, useState } from "react";

import type { AcademicService } from "@/server/services/academic-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { SubjectRowActions } from "@/components/tables/subject-row-actions";
import { deleteSubjectAction } from "@/server/controllers/academic-controller";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Subject = Awaited<ReturnType<typeof AcademicService.listSubjects>>[number];

export function SubjectsTable({ rows }: { rows: Subject[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter((s) => `${s.name} ${s.code ?? ""}`.toLowerCase().includes(q));
  }, [rows, query]);

  if (query !== lastQuery) {
    setLastQuery(query);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar query={query} onQueryChange={setQuery} searchPlaceholder="Cari nama atau kode..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell>{subject.name}</TableCell>
              <TableCell>{subject.code ?? "—"}</TableCell>
              <TableCell>
                <SubjectRowActions subject={subject} onDelete={() => deleteSubjectAction(subject.id)} />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada mata pelajaran" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
