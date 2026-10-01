"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, FileText, Trash2 } from "lucide-react";

import { EditTeacherDialog } from "@/components/tables/edit-teacher-dialog";
import { EditTeacherDapodikDialog } from "@/components/tables/edit-teacher-dapodik-dialog";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { teachers } from "@/lib/db/schema";

type Teacher = typeof teachers.$inferSelect;

export function TeacherRowActions({
  teacher,
  photoStorageKey,
  photoUpdatedAt,
  onDelete,
}: {
  teacher: Teacher;
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [dapodikOpen, setDapodikOpen] = useState(false);
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
          <DropdownMenuItem onClick={() => setDapodikOpen(true)}>
            <FileText className="size-4" />
            Data Dapodik
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
      <EditTeacherDapodikDialog teacher={teacher} open={dapodikOpen} onOpenChange={setDapodikOpen} />
      <DeleteEntityDialog name={name} onDelete={onDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
