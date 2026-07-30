"use client";

import type { ReactNode } from "react";
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
  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className={cn("max-h-[85vh] overflow-y-auto sm:max-w-lg", contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
