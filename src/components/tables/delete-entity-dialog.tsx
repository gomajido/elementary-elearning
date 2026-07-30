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
  description,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  name: string;
  /**
   * Returning `{ error }` keeps the dialog open and shows the reason —
   * how a delete that would drop student work refuses. A thrown error is
   * caught too, since Next.js redacts those in production.
   */
  onDelete: () => Promise<void | { error?: string }>;
  /** Overrides the default "hidden, not permanently deleted" note. */
  description?: string;
  /** Omit both to keep the default self-triggered icon-button behavior (used by every table but students). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null); // don't show a stale reason next time it opens
        setOpen(next);
      }}
    >
      {!isControlled && (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Trash2 className="size-4" />
          <span className="sr-only">Hapus {name}</span>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus {name}?</DialogTitle>
          <DialogDescription>{description ?? "Data akan disembunyikan, bukan dihapus permanen."}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              try {
                const result = await onDelete();
                if (result?.error) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
              } catch {
                setError("Gagal menghapus.");
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Menghapus…" : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
