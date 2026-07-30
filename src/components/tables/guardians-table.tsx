"use client";

import { useMemo, useState } from "react";

import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { GuardianRowActions } from "@/components/tables/guardian-row-actions";
import { deleteGuardianAction } from "@/server/controllers/guardian-controller";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type GuardianRow = {
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    relationshipType: "mother" | "father" | "guardian" | "other";
    userId: string | null;
  };
  children: string[];
};

export function GuardiansTable({
  rows,
  photoByGuardianId,
}: {
  rows: GuardianRow[];
  photoByGuardianId: Record<string, { storageKey: string; updatedAt: Date } | undefined>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter(({ guardian, children }) =>
      `${guardian.firstName} ${guardian.lastName} ${children.join(" ")}`.toLowerCase().includes(q),
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
      <TableToolbar query={query} onQueryChange={setQuery} searchPlaceholder="Cari nama wali atau anak..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Anak</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Akses Portal</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map(({ guardian, children }) => (
            <TableRow key={guardian.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EntityAvatar
                    storageKey={photoByGuardianId[guardian.id]?.storageKey}
                    updatedAt={photoByGuardianId[guardian.id]?.updatedAt}
                    name={`${guardian.firstName} ${guardian.lastName}`}
                    size="sm"
                  />
                  {guardian.firstName} {guardian.lastName}
                </div>
              </TableCell>
              <TableCell>{children.join(", ") || "—"}</TableCell>
              <TableCell>{guardian.phone ?? guardian.email ?? "—"}</TableCell>
              <TableCell>
                {guardian.userId ? (
                  <Badge variant="secondary">Aktif</Badge>
                ) : (
                  <Badge variant="outline">Belum Aktif</Badge>
                )}
              </TableCell>
              <TableCell>
                <GuardianRowActions
                  guardian={guardian}
                  photoStorageKey={photoByGuardianId[guardian.id]?.storageKey}
                  photoUpdatedAt={photoByGuardianId[guardian.id]?.updatedAt}
                  hasPortalAccess={!!guardian.userId}
                  onDelete={() => deleteGuardianAction(guardian.id)}
                />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada wali" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
