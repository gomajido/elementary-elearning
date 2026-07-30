"use client";

import { useState, type ReactNode } from "react";

import { ContentItemForm } from "@/components/forms/content-item-form";
import { AssignmentForm } from "@/components/forms/assignment-form";
import { QuizForm } from "@/components/forms/quiz-form";
import { ThemeForm } from "@/components/forms/theme-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * The add-forms live in dialogs that close themselves once the action
 * succeeds — otherwise the form stays open, still filled and still
 * submittable, and a second click creates a duplicate.
 */
function AddDialog({
  triggerLabel,
  title,
  children,
  className,
}: {
  triggerLabel: string;
  title: string;
  children: (close: () => void) => ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>{triggerLabel}</DialogTrigger>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}

export function AddThemeDialog({ courseId }: { courseId: string }) {
  return (
    <AddDialog triggerLabel="Tambah Bab" title="Tambah Bab" className="sm:max-w-sm">
      {(close) => <ThemeForm courseId={courseId} onSuccess={close} />}
    </AddDialog>
  );
}

export function AddContentItemDialog({
  courseId,
  themeId,
  themeTitle,
}: {
  courseId: string;
  themeId: string;
  themeTitle: string;
}) {
  return (
    <AddDialog triggerLabel="Tambah materi" title={`Tambah materi — ${themeTitle}`} className="sm:max-w-md">
      {(close) => <ContentItemForm courseId={courseId} themeId={themeId} onSuccess={close} />}
    </AddDialog>
  );
}

export function AddAssignmentDialog({
  courseId,
  themeId,
  themeTitle,
}: {
  courseId: string;
  themeId: string;
  themeTitle: string;
}) {
  return (
    <AddDialog triggerLabel="Tambah tugas" title={`Tambah tugas — ${themeTitle}`} className="sm:max-w-md">
      {(close) => <AssignmentForm courseId={courseId} themeId={themeId} onSuccess={close} />}
    </AddDialog>
  );
}

export function AddQuizDialog({
  courseId,
  themeId,
  themeTitle,
}: {
  courseId: string;
  themeId: string;
  themeTitle: string;
}) {
  return (
    <AddDialog triggerLabel="Tambah kuis" title={`Tambah kuis — ${themeTitle}`} className="sm:max-w-md">
      {(close) => <QuizForm courseId={courseId} themeId={themeId} onSuccess={close} />}
    </AddDialog>
  );
}
