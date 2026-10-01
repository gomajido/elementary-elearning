"use client";

import { TeacherDapodikForm } from "@/components/forms/teacher-dapodik-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { teachers } from "@/lib/db/schema";

type Teacher = typeof teachers.$inferSelect;

export function EditTeacherDapodikDialog({
  teacher,
  open,
  onOpenChange,
}: {
  teacher: Teacher;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Data Dapodik — {teacher.firstName} {teacher.lastName}
          </DialogTitle>
        </DialogHeader>
        <TeacherDapodikForm teacher={teacher} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
