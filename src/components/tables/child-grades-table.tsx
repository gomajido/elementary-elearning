"use client";

import { useMemo, useState } from "react";

import type { GradeService } from "@/server/services/grade-service";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/tables/table-pagination";

type Grades = Awaited<ReturnType<typeof GradeService.gradesForStudent>>;

const KIND_OPTIONS = [
  { value: "Tugas", label: "Tugas" },
  { value: "Kuis", label: "Kuis" },
];

export function ChildGradesTable({ grades }: { grades: Grades }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);

  const items = useMemo(
    () => [
      ...grades.assignments.map((a) => ({ ...a, kind: "Tugas" as const })),
      ...grades.quizzes.map((q) => ({ ...q, kind: "Kuis" as const })),
    ],
    [grades]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = q === "" || `${item.title} ${item.courseTitle}`.toLowerCase().includes(q);
      const matchesKind = kind === "all" || item.kind === kind;
      return matchesQuery && matchesKind;
    });
  }, [items, query, kind]);

  const filterKey = `${query}|${kind}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Cari tugas, kuis, atau modul..."
        filterValue={kind}
        onFilterChange={setKind}
        filterPlaceholder="Jenis"
        filterOptions={KIND_OPTIONS}
      />
      <div className="flex flex-col gap-3">
        {paged.map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span>
              {item.title} <span className="text-muted-foreground">({item.kind} — {item.courseTitle})</span>
            </span>
            <span>{item.score !== null ? `${item.score} / ${item.maxScore}` : "Belum dinilai"}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">{items.length === 0 ? "Belum ada nilai" : "Tidak ditemukan"}</p>
        )}
      </div>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
