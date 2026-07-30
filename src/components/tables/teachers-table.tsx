"use client";

import { useMemo, useState } from "react";

import type { TeacherService } from "@/server/services/teacher-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { TeacherRowActions } from "@/components/tables/teacher-row-actions";
import { deleteTeacherAction } from "@/server/controllers/teacher-controller";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Teacher = Awaited<ReturnType<typeof TeacherService.listTeachers>>[number];

export function TeachersTable({
  rows,
  photoByTeacherId,
}: {
  rows: Teacher[];
  photoByTeacherId: Record<string, { storageKey: string; updatedAt: Date } | undefined>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter((t) => `${t.firstName} ${t.lastName} ${t.employeeNumber}`.toLowerCase().includes(q));
  }, [rows, query]);

  if (query !== lastQuery) {
    setLastQuery(query);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar query={query} onQueryChange={setQuery} searchPlaceholder="Cari nama atau no. pegawai..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>No. Pegawai</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EntityAvatar
                    storageKey={photoByTeacherId[teacher.id]?.storageKey}
                    updatedAt={photoByTeacherId[teacher.id]?.updatedAt}
                    name={`${teacher.firstName} ${teacher.lastName}`}
                    size="sm"
                  />
                  {teacher.firstName} {teacher.lastName}
                </div>
              </TableCell>
              <TableCell>{teacher.employeeNumber}</TableCell>
              <TableCell>{teacher.phone ?? "—"}</TableCell>
              <TableCell>
                <TeacherRowActions
                  teacher={teacher}
                  photoStorageKey={photoByTeacherId[teacher.id]?.storageKey}
                  photoUpdatedAt={photoByTeacherId[teacher.id]?.updatedAt}
                  onDelete={() => deleteTeacherAction(teacher.id)}
                />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada guru" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
