"use client";

import { useMemo, useState } from "react";

import type { StudentService } from "@/server/services/student-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";
import { StudentRowActions } from "@/components/tables/student-row-actions";
import { deleteStudentAction } from "@/server/controllers/student-controller";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ENROLLMENT_STATUS_LABELS, label } from "@/lib/labels";

type StudentRow = Awaited<ReturnType<typeof StudentService.listStudentsWithDetails>>[number];

export function StudentsTable({
  rows,
  classes,
  photoByStudentId,
}: {
  rows: StudentRow[];
  classes: { id: string; name: string; section: string | null }[];
  photoByStudentId: Record<string, { storageKey: string; updatedAt: Date } | undefined>;
}) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        q === "" ||
        `${row.student.firstName} ${row.student.lastName} ${row.student.admissionNumber}`.toLowerCase().includes(q);
      const matchesClass = classFilter === "all" || row.student.currentClassId === classFilter;
      return matchesQuery && matchesClass;
    });
  }, [rows, query, classFilter]);

  const filterKey = `${query}|${classFilter}`;
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
        searchPlaceholder="Cari nama atau no. induk..."
        filterValue={classFilter}
        onFilterChange={setClassFilter}
        filterPlaceholder="Kelas"
        filterOptions={classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` ${c.section}` : ""}` }))}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Induk</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Tgl Lahir</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Akses Portal</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row) => (
            <TableRow key={row.student.id}>
              <TableCell>{row.student.admissionNumber}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EntityAvatar
                    storageKey={photoByStudentId[row.student.id]?.storageKey}
                    updatedAt={photoByStudentId[row.student.id]?.updatedAt}
                    name={`${row.student.firstName} ${row.student.lastName}`}
                    size="sm"
                  />
                  {row.student.firstName} {row.student.lastName}
                </div>
              </TableCell>
              <TableCell>
                {row.className ? `${row.className}${row.classSection ? ` ${row.classSection}` : ""}` : "—"}
              </TableCell>
              <TableCell>{row.student.dateOfBirth}</TableCell>
              <TableCell>{label(ENROLLMENT_STATUS_LABELS, row.student.enrollmentStatus)}</TableCell>
              <TableCell>
                {row.student.userId ? (
                  <Badge variant="secondary">Aktif</Badge>
                ) : (
                  <Badge variant="outline">Belum Aktif</Badge>
                )}
              </TableCell>
              <TableCell>
                <StudentRowActions
                  student={row.student}
                  classes={classes}
                  photoStorageKey={photoByStudentId[row.student.id]?.storageKey}
                  photoUpdatedAt={photoByStudentId[row.student.id]?.updatedAt}
                  hasPortalAccess={!!row.student.userId}
                  onDelete={() => deleteStudentAction(row.student.id)}
                />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {rows.length === 0 ? "Belum ada siswa" : "Tidak ditemukan"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
