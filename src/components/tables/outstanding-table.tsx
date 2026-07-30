"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { FeeService } from "@/server/services/fee-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OutstandingRow = Awaited<ReturnType<typeof FeeService.outstandingBalanceReport>>[number];

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

export function OutstandingTable({ rows }: { rows: OutstandingRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter(({ invoice, student }) =>
      `${invoice.invoiceNumber} ${student.firstName} ${student.lastName}`.toLowerCase().includes(q),
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
      <TableToolbar query={query} onQueryChange={setQuery} searchPlaceholder="Cari no. tagihan atau nama siswa..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Tagihan</TableHead>
            <TableHead>Siswa</TableHead>
            <TableHead>Sisa Tagihan</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map(({ invoice, student, balanceCents }) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link href={`/admin/fees/invoices/${invoice.id}`} className="underline underline-offset-4">
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                {student.firstName} {student.lastName}
              </TableCell>
              <TableCell>{formatCents(balanceCents)}</TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Tidak ada tunggakan" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
