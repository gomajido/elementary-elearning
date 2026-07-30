"use client";

import { useState, type ReactNode } from "react";
import { EllipsisVertical, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import { EditThemeForm } from "@/components/forms/edit-theme-form";
import { EditContentItemForm } from "@/components/forms/edit-content-item-form";
import { EditAssignmentForm } from "@/components/forms/edit-assignment-form";
import { EditQuizForm } from "@/components/forms/edit-quiz-form";
import { DeleteEntityDialog } from "@/components/tables/delete-entity-dialog";
import { deleteThemeAction, moveThemeAction, deleteContentItemAction } from "@/server/controllers/course-controller";
import { deleteAssignmentAction } from "@/server/controllers/assignment-controller";
import { deleteQuizAction } from "@/server/controllers/quiz-controller";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContentItemType } from "@/lib/db/schema";

/**
 * Shared edit/delete menu for the things inside a course. The delete dialog
 * shows the reason when the server refuses (e.g. a Bab that still holds
 * materi, or a tugas students have already submitted).
 */
function ItemActions({
  label,
  deleteName,
  deleteDescription,
  onDelete,
  extraItems,
  children,
}: {
  label: string;
  deleteName: string;
  deleteDescription?: string;
  onDelete: () => Promise<void | { error?: string }>;
  extraItems?: (close: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Aksi untuk {deleteName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit min-w-0 [&_[data-slot=dropdown-menu-item]]:text-xs [&_[data-slot=dropdown-menu-item]]:whitespace-nowrap">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            {label}
          </DropdownMenuItem>
          {extraItems?.(() => setEditOpen(false))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          {/* Mounted only while open so the inputs' defaultValue is re-read
              each time — otherwise a saved edit leaves the form showing the
              old value until a full reload.

              Do NOT also key this on the item's values to silence Base UI's
              "changing the default value of an uncontrolled FieldControl"
              warning: revalidation changes those values while the dialog is
              still open, the remount resets useActionState, and onSuccess
              never fires — so the dialog stops closing. The warning is
              dev-only and cosmetic; that regression is not. */}
          {editOpen && children(() => setEditOpen(false))}
        </DialogContent>
      </Dialog>

      <DeleteEntityDialog
        name={deleteName}
        description={deleteDescription}
        onDelete={onDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

export function ThemeActions({
  theme,
  canMoveUp,
  canMoveDown,
}: {
  theme: { id: string; title: string };
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <ItemActions
      label="Edit Bab"
      deleteName={theme.title}
      onDelete={() => deleteThemeAction(theme.id)}
      extraItems={() => (
        <>
          {canMoveUp && (
            <DropdownMenuItem onClick={() => moveThemeAction(theme.id, "up")}>
              <ChevronUp className="size-4" />
              Naikkan
            </DropdownMenuItem>
          )}
          {canMoveDown && (
            <DropdownMenuItem onClick={() => moveThemeAction(theme.id, "down")}>
              <ChevronDown className="size-4" />
              Turunkan
            </DropdownMenuItem>
          )}
        </>
      )}
    >
      {(close) => <EditThemeForm theme={theme} onSuccess={close} />}
    </ItemActions>
  );
}

export function ContentItemActions({
  item,
}: {
  item: {
    id: string;
    title: string;
    type: ContentItemType;
    bodyMarkdown: string | null;
    externalUrl: string | null;
  };
}) {
  return (
    <ItemActions label="Edit materi" deleteName={item.title} onDelete={() => deleteContentItemAction(item.id)}>
      {(close) => <EditContentItemForm item={item} onSuccess={close} />}
    </ItemActions>
  );
}

export function AssignmentActions({
  assignment,
}: {
  assignment: {
    id: string;
    title: string;
    instructions: string | null;
    dueDate: string;
    maxScore: number;
    allowLateSubmission: boolean;
  };
}) {
  return (
    <ItemActions
      label="Edit tugas"
      deleteName={assignment.title}
      onDelete={() => deleteAssignmentAction(assignment.id)}
    >
      {(close) => <EditAssignmentForm assignment={assignment} onSuccess={close} />}
    </ItemActions>
  );
}

export function QuizActions({
  quiz,
}: {
  quiz: { id: string; title: string; timeLimitMinutes: number | null; maxAttempts: number };
}) {
  return (
    <ItemActions label="Edit kuis" deleteName={quiz.title} onDelete={() => deleteQuizAction(quiz.id)}>
      {(close) => <EditQuizForm quiz={quiz} onSuccess={close} />}
    </ItemActions>
  );
}
