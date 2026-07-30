"use client";

import { Button } from "@/components/ui/button";

export const TABLE_PAGE_SIZE = 20;

export function TablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
      <span>
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Sebelumnya
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
