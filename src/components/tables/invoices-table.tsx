"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { FeeService } from "@/server/services/fee-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { DeleteOnlyRowActions } from "@/components/tables/delete-only-row-actions";
import { deleteInvoiceAction } from "@/server/controllers/fee-controller";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, label } from "@/lib/labels";

type Invoice = Awaited<ReturnType<typeof FeeService.allInvoicesWithSummary>>[number];

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

const STATUS_VARIANT = { paid: "secondary", partial: "outline", unpaid: "destructive" } as const;
const STATUS_OPTIONS = (["paid", "partial", "unpaid"] as const).map((value) => ({
  value,
  label: label(INVOICE_STATUS_LABELS, value),
}));

export function InvoicesTable({ rows }: { rows: Invoice[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        q === "" ||
        `${row.invoice.invoiceNumber} ${row.student.firstName} ${row.student.lastName}`.toLowerCase().includes(q);
      const matchesStatus = status === "all" || row.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, status]);

  const filterKey = `${query}|${status}`;
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
        searchPlaceholder="Cari no. tagihan atau nama siswa..."
        filterValue={status}
        onFilterChange={setStatus}
        filterPlaceholder="Status"
        filterOptions={STATUS_OPTIONS}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Tagihan</TableHead>
            <TableHead>Siswa</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Sisa Tagihan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map(({ invoice, student, balanceCents, status: rowStatus, hasPendingVerification }) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link href={`/admin/fees/invoices/${invoice.id}`} className="underline underline-offset-4">
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                {student.firstName} {student.lastName}
              </TableCell>
              <TableCell>{formatCents(invoice.totalAmountCents)}</TableCell>
              <TableCell>{formatCents(balanceCents)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant={STATUS_VARIANT[rowStatus]}>{label(INVOICE_STATUS_LABELS, rowStatus)}</Badge>
                  {hasPendingVerification && <Badge variant="outline">Menunggu verifikasi</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <DeleteOnlyRowActions name={invoice.invoiceNumber} onDelete={() => deleteInvoiceAction(invoice.id)} />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada tagihan" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
