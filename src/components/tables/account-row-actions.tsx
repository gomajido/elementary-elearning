"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, KeyRound, Shield, ShieldOff } from "lucide-react";

import { EditAccountDialog } from "@/components/tables/edit-account-dialog";
import { ResetPasswordDialog } from "@/components/tables/reset-password-dialog";
import { grantAdminAccessAction, revokeAdminAccessAction } from "@/server/controllers/account-controller";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/db/schema";

export function AccountRowActions({
  account,
  name,
  role,
  hasAdminGrant,
  viewerIsBaseAdmin,
}: {
  account: { id: string; email: string | null; username: string | null };
  name: string;
  role: Role;
  hasAdminGrant: boolean;
  viewerIsBaseAdmin: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleGrantToggle() {
    setPending(true);
    try {
      if (hasAdminGrant) await revokeAdminAccessAction(account.id);
      else await grantAdminAccessAction(account.id);
    } finally {
      setPending(false);
    }
  }

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
            Ubah email/username
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetOpen(true)}>
            <KeyRound className="size-4" />
            Reset kata sandi
          </DropdownMenuItem>
          {viewerIsBaseAdmin && role === "teacher" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={pending} onClick={handleGrantToggle}>
                {hasAdminGrant ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                {hasAdminGrant ? "Cabut akses admin" : "Beri akses admin"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditAccountDialog account={account} name={name} open={editOpen} onOpenChange={setEditOpen} />
      <ResetPasswordDialog userId={account.id} name={name} open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}
