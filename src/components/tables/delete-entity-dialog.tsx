"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteEntityDialog({
  name,
  onDelete,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  name: string;
  onDelete: () => Promise<void>;
  /** Omit both to keep the default self-triggered icon-button behavior (used by every table but students). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Trash2 className="size-4" />
          <span className="sr-only">Hapus {name}</span>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus {name}?</DialogTitle>
          <DialogDescription>Data akan disembunyikan, bukan dihapus permanen.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await onDelete();
              setPending(false);
              setOpen(false);
            }}
          >
            {pending ? "Menghapus…" : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
