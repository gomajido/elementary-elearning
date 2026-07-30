"use client";

import { useActionState } from "react";

import { adminResetPasswordAction, type ResetPasswordState } from "@/server/controllers/account-controller";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const initialState: ResetPasswordState = {};

export function ResetPasswordDialog({
  userId,
  name,
  open,
  onOpenChange,
}: {
  userId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(adminResetPasswordAction, initialState);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset kata sandi — {name}</DialogTitle>
          {!state.tempPassword && (
            <DialogDescription>
              Kata sandi lama akan diganti dengan kata sandi sementara baru. Akun ini harus menggantinya saat masuk berikutnya.
            </DialogDescription>
          )}
        </DialogHeader>

        {state.tempPassword ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950">
            <p className="font-medium">
              Kata sandi sementara: <code className="rounded bg-background px-1.5 py-0.5">{state.tempPassword}</code>
            </p>
            <p className="mt-1 text-muted-foreground">Bagikan sekarang — hanya ditampilkan sekali.</p>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="userId" value={userId} />
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter className="mt-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Memproses…" : "Reset kata sandi"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
