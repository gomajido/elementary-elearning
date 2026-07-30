"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, KeyRound, Trash2 } from "lucide-react";

import { EditStudentDialog } from "@/components/tables/edit-student-dialog";
import { GrantStudentAccessDialog } from "@/components/tables/grant-student-access-dialog";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EnrollmentStatus, Gender } from "@/lib/db/schema";

export function StudentRowActions({
  student,
  classes,
  photoStorageKey,
  photoUpdatedAt,
  hasPortalAccess,
  onDelete,
}: {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    currentClassId: string | null;
    enrollmentDate: string;
    enrollmentStatus: EnrollmentStatus;
  };
  classes: { id: string; name: string; section: string | null }[];
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  hasPortalAccess: boolean;
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const name = `${student.firstName} ${student.lastName}`;

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
            Edit siswa
          </DropdownMenuItem>
          {!hasPortalAccess && (
            <DropdownMenuItem onClick={() => setAccessOpen(true)}>
              <KeyRound className="size-4" />
              Kelola akses portal
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditStudentDialog
        student={student}
        classes={classes}
        photoStorageKey={photoStorageKey}
        photoUpdatedAt={photoUpdatedAt}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {!hasPortalAccess && (
        <GrantStudentAccessDialog studentId={student.id} name={name} open={accessOpen} onOpenChange={setAccessOpen} />
      )}
      <DeleteEntityDialog name={name} onDelete={onDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
