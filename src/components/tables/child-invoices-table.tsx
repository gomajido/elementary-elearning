"use client";

import { useMemo, useState } from "react";

import type { FeeService } from "@/server/services/fee-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { SubmitPaymentProofDialog } from "@/components/forms/submit-payment-proof-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, label } from "@/lib/labels";

type InvoiceRow = Awaited<ReturnType<typeof FeeService.invoicesForStudent>>[number];

const STATUS_VARIANT = { paid: "secondary", partial: "outline", unpaid: "destructive" } as const;
const STATUS_OPTIONS = Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

export function ChildInvoicesTable({ rows, onPaymentSubmitted }: { rows: InvoiceRow[]; onPaymentSubmitted?: () => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery = q === "" || row.invoice.invoiceNumber.toLowerCase().includes(q);
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
        searchPlaceholder="Cari no. tagihan..."
        filterValue={status}
        onFilterChange={setStatus}
        filterPlaceholder="Status"
        filterOptions={STATUS_OPTIONS}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Tagihan</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Sisa Tagihan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map(({ invoice, balanceCents, status: invoiceStatus, hasPendingVerification }) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.invoiceNumber}</TableCell>
              <TableCell>{formatCents(invoice.totalAmountCents)}</TableCell>
              <TableCell>{formatCents(balanceCents)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant={STATUS_VARIANT[invoiceStatus]}>{label(INVOICE_STATUS_LABELS, invoiceStatus)}</Badge>
                  {hasPendingVerification && <Badge variant="outline">Menunggu verifikasi</Badge>}
                </div>
              </TableCell>
              <TableCell>
                {balanceCents > 0 && (
                  <SubmitPaymentProofDialog
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                    onSubmitted={onPaymentSubmitted}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
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
