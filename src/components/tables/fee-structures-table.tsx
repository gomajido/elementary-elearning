"use client";

import { useMemo, useState } from "react";

import type { FeeService } from "@/server/services/fee-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { FeeStructureRowActions } from "@/components/tables/fee-structure-row-actions";
import { deleteFeeStructureAction } from "@/server/controllers/fee-controller";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FEE_FREQUENCY_LABELS, label } from "@/lib/labels";

type FeeStructure = Awaited<ReturnType<typeof FeeService.listFeeStructures>>[number];

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

const FREQUENCY_OPTIONS = Object.entries(FEE_FREQUENCY_LABELS).map(([value, label]) => ({ value, label }));

export function FeeStructuresTable({
  rows,
  academicYears,
}: {
  rows: FeeStructure[];
  academicYears: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [frequency, setFrequency] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((s) => {
      const matchesQuery = q === "" || s.name.toLowerCase().includes(q);
      const matchesFrequency = frequency === "all" || s.frequency === frequency;
      return matchesQuery && matchesFrequency;
    });
  }, [rows, query, frequency]);

  const filterKey = `${query}|${frequency}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Cari nama biaya..."
        filterValue={frequency}
        onFilterChange={setFrequency}
        filterPlaceholder="Frekuensi"
        filterOptions={FREQUENCY_OPTIONS}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Frekuensi</TableHead>
            <TableHead>Tingkat</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.name}</TableCell>
              <TableCell>{formatCents(s.amountCents)}</TableCell>
              <TableCell>{label(FEE_FREQUENCY_LABELS, s.frequency)}</TableCell>
              <TableCell>{s.gradeLevel ?? "Semua"}</TableCell>
              <TableCell>
                <FeeStructureRowActions
                  structure={s}
                  academicYears={academicYears}
                  onDelete={() => deleteFeeStructureAction(s.id)}
                />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada biaya" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
