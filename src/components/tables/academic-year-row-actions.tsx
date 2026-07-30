"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

import { EditAcademicYearDialog } from "@/components/tables/edit-academic-year-dialog";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AcademicYearRowActions({
  year,
  onDelete,
}: {
  year: { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean };
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Aksi untuk {year.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit min-w-0 [&_[data-slot=dropdown-menu-item]]:text-xs [&_[data-slot=dropdown-menu-item]]:whitespace-nowrap">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit tahun ajaran
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditAcademicYearDialog year={year} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteEntityDialog name={year.name} onDelete={onDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
