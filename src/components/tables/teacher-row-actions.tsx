"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

import { EditTeacherDialog } from "@/components/tables/edit-teacher-dialog";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TeacherRowActions({
  teacher,
  photoStorageKey,
  photoUpdatedAt,
  onDelete,
}: {
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    phone: string | null;
    hireDate: string | null;
  };
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const name = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Aksi untuk {name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit min-w-0 [&_[data-slot=dropdown-menu-item]]:text-xs [&_[data-slot=dropdown-menu-item]]:whitespace-nowrap">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit guru
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTeacherDialog
        teacher={teacher}
        photoStorageKey={photoStorageKey}
        photoUpdatedAt={photoUpdatedAt}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteEntityDialog name={name} onDelete={onDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
