"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

import { EditClassDialog } from "@/components/tables/edit-class-dialog";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ClassRowActions({
  classRow,
  academicYears,
  teachers,
  photoStorageKey,
  photoUpdatedAt,
  onDelete,
}: {
  classRow: {
    id: string;
    name: string;
    section: string | null;
    gradeLevel: number;
    academicYearId: string;
    classTeacherId: string | null;
    capacity: number | null;
  };
  academicYears: { id: string; name: string }[];
  teachers: { id: string; firstName: string; lastName: string }[];
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Aksi untuk {classRow.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit min-w-0 [&_[data-slot=dropdown-menu-item]]:text-xs [&_[data-slot=dropdown-menu-item]]:whitespace-nowrap">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit kelas
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditClassDialog
        classRow={classRow}
        academicYears={academicYears}
        teachers={teachers}
        photoStorageKey={photoStorageKey}
        photoUpdatedAt={photoUpdatedAt}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteEntityDialog name={classRow.name} onDelete={onDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
