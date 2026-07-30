"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, KeyRound, Trash2 } from "lucide-react";

import { EditGuardianDialog } from "@/components/tables/edit-guardian-dialog";
import { GrantGuardianAccessDialog } from "@/components/tables/grant-guardian-access-dialog";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function GuardianRowActions({
  guardian,
  photoStorageKey,
  photoUpdatedAt,
  hasPortalAccess,
  onDelete,
}: {
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    relationshipType: "mother" | "father" | "guardian" | "other";
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  hasPortalAccess: boolean;
  onDelete: () => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const name = `${guardian.firstName} ${guardian.lastName}`;

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
            Edit wali
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

      <EditGuardianDialog
        guardian={guardian}
        photoStorageKey={photoStorageKey}
        photoUpdatedAt={photoUpdatedAt}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {!hasPortalAccess && (
        <GrantGuardianAccessDialog
          guardianId={guardian.id}
          defaultEmail={guardian.email ?? undefined}
          name={name}
          open={accessOpen}
          onOpenChange={setAccessOpen}
        />
      )}
      <DeleteEntityDialog name={name} onDelete={onDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
