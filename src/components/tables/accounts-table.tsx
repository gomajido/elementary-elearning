"use client";

import { useMemo, useState } from "react";

import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { AccountRowActions } from "@/components/tables/account-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, label } from "@/lib/labels";
import type { Role } from "@/lib/db/schema";

type Account = {
  id: string;
  email: string | null;
  username: string | null;
  roles: Role[];
  isActive: boolean;
};

export function AccountsTable({
  accounts,
  nameByUserId,
  viewerIsBaseAdmin,
}: {
  accounts: Account[];
  nameByUserId: Record<string, string>;
  viewerIsBaseAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((account) => {
      const name = nameByUserId[account.id] ?? "";
      const matchesQuery =
        q === "" ||
        `${name} ${account.email ?? ""} ${account.username ?? ""}`.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || account.roles[0] === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [accounts, nameByUserId, query, roleFilter]);

  const filterKey = `${query}|${roleFilter}`;
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
        searchPlaceholder="Cari nama, email, atau username..."
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterPlaceholder="Peran"
        filterOptions={Object.entries(ROLE_LABELS).map(([value, roleLabel]) => ({ value, label: roleLabel }))}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Peran</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((account) => {
            const primaryRole = account.roles[0];
            const hasAdminGrant = primaryRole !== "admin" && account.roles.includes("admin");
            return (
              <TableRow key={account.id}>
                <TableCell>{nameByUserId[account.id] ?? "—"}</TableCell>
                <TableCell>{account.email ?? "—"}</TableCell>
                <TableCell>{account.username ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {label(ROLE_LABELS, primaryRole)}
                    {hasAdminGrant && <Badge variant="secondary">+ Admin</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {account.isActive ? (
                    <Badge variant="secondary">Aktif</Badge>
                  ) : (
                    <Badge variant="outline">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <AccountRowActions
                    account={account}
                    name={nameByUserId[account.id] ?? account.email ?? account.username ?? "Akun"}
                    role={primaryRole}
                    hasAdminGrant={hasAdminGrant}
                    viewerIsBaseAdmin={viewerIsBaseAdmin}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {accounts.length === 0 ? "Belum ada akun" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
