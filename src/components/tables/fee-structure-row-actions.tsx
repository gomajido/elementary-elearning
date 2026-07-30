"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

import { EditFeeStructureDialog } from "@/components/tables/edit-fee-structure-dialog";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FeeFrequency } from "@/lib/db/schema";

export function FeeStructureRowActions({
  structure,
  academicYears,
  onDelete,
}: {
  structure: {
    id: string;
    name: string;
    amountCents: number;
    frequency: FeeFrequency;
    academicYearId: string;
    gradeLevel: number | null;
  };
  academicYears: { id: string; name: string }[];
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Aksi untuk {structure.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit min-w-0 [&_[data-slot=dropdown-menu-item]]:text-xs [&_[data-slot=dropdown-menu-item]]:whitespace-nowrap">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit biaya
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditFeeStructureDialog
        structure={structure}
        academicYears={academicYears}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteEntityDialog name={structure.name} onDelete={onDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
