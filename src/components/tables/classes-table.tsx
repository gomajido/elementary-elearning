"use client";

import { useMemo, useState } from "react";

import type { AcademicService } from "@/server/services/academic-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { ClassRowActions } from "@/components/tables/class-row-actions";
import { deleteClassAction } from "@/server/controllers/academic-controller";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ClassRow = Awaited<ReturnType<typeof AcademicService.listClassesWithDetails>>[number];

export function ClassesTable({
  rows,
  academicYears,
  teachers,
  photoByClassId,
}: {
  rows: ClassRow[];
  academicYears: { id: string; name: string }[];
  teachers: { id: string; firstName: string; lastName: string }[];
  photoByClassId: Record<string, { storageKey: string; updatedAt: Date } | undefined>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter((row) =>
      `${row.class.name} ${row.class.section ?? ""} ${row.classTeacherFirstName ?? ""} ${row.classTeacherLastName ?? ""}`
        .toLowerCase()
        .includes(q),
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
      <TableToolbar query={query} onQueryChange={setQuery} searchPlaceholder="Cari nama kelas atau wali kelas..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kelas</TableHead>
            <TableHead>Tingkat</TableHead>
            <TableHead>Tahun ajaran</TableHead>
            <TableHead>Wali kelas</TableHead>
            <TableHead>Kapasitas</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row) => (
            <TableRow key={row.class.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EntityAvatar
                    storageKey={photoByClassId[row.class.id]?.storageKey}
                    updatedAt={photoByClassId[row.class.id]?.updatedAt}
                    name={row.class.name}
                    size="sm"
                  />
                  {row.class.name}
                  {row.class.section ? ` ${row.class.section}` : ""}
                </div>
              </TableCell>
              <TableCell>{row.class.gradeLevel}</TableCell>
              <TableCell>{row.academicYearName}</TableCell>
              <TableCell>
                {row.classTeacherFirstName ? `${row.classTeacherFirstName} ${row.classTeacherLastName}` : "—"}
              </TableCell>
              <TableCell>{row.class.capacity ?? "—"}</TableCell>
              <TableCell>
                <ClassRowActions
                  classRow={row.class}
                  academicYears={academicYears}
                  teachers={teachers}
                  photoStorageKey={photoByClassId[row.class.id]?.storageKey}
                  photoUpdatedAt={photoByClassId[row.class.id]?.updatedAt}
                  onDelete={() => deleteClassAction(row.class.id)}
                />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada kelas" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
