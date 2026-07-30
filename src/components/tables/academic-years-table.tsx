"use client";

import { useMemo, useState } from "react";

import type { AcademicService } from "@/server/services/academic-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { AcademicYearRowActions } from "@/components/tables/academic-year-row-actions";
import { deleteAcademicYearAction } from "@/server/controllers/academic-controller";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type AcademicYear = Awaited<ReturnType<typeof AcademicService.listAcademicYears>>[number];

export function AcademicYearsTable({ rows }: { rows: AcademicYear[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter((y) => y.name.toLowerCase().includes(q));
  }, [rows, query]);

  if (query !== lastQuery) {
    setLastQuery(query);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar query={query} onQueryChange={setQuery} searchPlaceholder="Cari nama tahun ajaran..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Mulai</TableHead>
            <TableHead>Selesai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((year) => (
            <TableRow key={year.id}>
              <TableCell>{year.name}</TableCell>
              <TableCell>{year.startDate}</TableCell>
              <TableCell>{year.endDate}</TableCell>
              <TableCell>{year.isCurrent && <Badge>Aktif</Badge>}</TableCell>
              <TableCell>
                <AcademicYearRowActions year={year} onDelete={() => deleteAcademicYearAction(year.id)} />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada tahun ajaran" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
