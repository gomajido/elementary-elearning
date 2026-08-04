"use client";

import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Controlled (not just a passthrough <Dialog>) so the wrapped form can
 * signal "I'm done" back up — it injects an `onSuccess` prop into its
 * single child element, closing itself and refreshing the route's data
 * when called. Every create-form here reads that via useActionSuccess
 * (src/lib/hooks/use-action-success.ts) except TeacherForm, which
 * deliberately stays open to show a one-time temp password — it just
 * doesn't read the prop, so the injection is harmless there.
 *
 * router.refresh() alongside close is intentionally redundant with each
 * action's own revalidatePath() — belt-and-suspenders, since this app now
 * also runs on Cloudflare Workers/OpenNext (see RFC 0004), where caching
 * has already surprised us once (the /setup static-prerender bug).
 */
export function ActionDialog({
  triggerLabel,
  title,
  description,
  children,
  contentClassName,
}: {
  triggerLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className={cn("sm:max-w-lg", contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {isValidElement(children)
          ? cloneElement(children as ReactElement<{ onSuccess?: () => void }>, { onSuccess: handleSuccess })
          : children}
      </DialogContent>
    </Dialog>
  );
}
