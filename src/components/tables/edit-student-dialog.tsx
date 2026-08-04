"use client";

import { EditStudentForm } from "@/components/forms/edit-student-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EnrollmentStatus, Gender } from "@/lib/db/schema";

export function EditStudentDialog({
  student,
  classes,
  photoStorageKey,
  photoUpdatedAt,
  open,
  onOpenChange,
}: {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    currentClassId: string | null;
    enrollmentDate: string;
    enrollmentStatus: EnrollmentStatus;
  };
  classes: { id: string; name: string; section: string | null }[];
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit siswa — {student.firstName} {student.lastName}
          </DialogTitle>
        </DialogHeader>
        <EditStudentForm
          student={student}
          classes={classes}
          photoStorageKey={photoStorageKey}
          photoUpdatedAt={photoUpdatedAt}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
