"use client";

import { useEffect, useState } from "react";

import { getApplicationDetailAction } from "@/server/controllers/registration-controller";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RegistrationDetailSections, type RegistrationApplicationRow } from "@/components/shared/registration-detail-sections";

type ApplicationDetail = Awaited<ReturnType<typeof getApplicationDetailAction>>;

export function StudentRegistrationDetailDialog({
  application,
  studentName,
  open,
  onOpenChange,
}: {
  application: RegistrationApplicationRow;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);

  useEffect(() => {
    if (!open) return;
    getApplicationDetailAction(application.id).then(setDetail);
  }, [open, application.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail pendaftaran — {studentName}</DialogTitle>
        </DialogHeader>
        <RegistrationDetailSections application={application} subRecords={detail} />
      </DialogContent>
    </Dialog>
  );
}
