"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  approveApplicationAction,
  rejectApplicationAction,
  type ApproveApplicationState,
  type RejectApplicationState,
} from "@/server/controllers/registration-controller";
import type { RegistrationService } from "@/server/services/registration-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Application = Awaited<ReturnType<typeof RegistrationService.listPending>>[number];

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

const initialApproveState: ApproveApplicationState = {};
const initialRejectState: RejectApplicationState = {};

function ApproveDialog({
  application,
  classes,
  academicYears,
  open,
  onOpenChange,
}: {
  application: Application;
  classes: { id: string; name: string; section: string | null; academicYearId: string }[];
  academicYears: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(approveApplicationAction, initialApproveState);
  const { firstName, lastName } = splitFullName(application.fullName);
  const [academicYearId, setAcademicYearId] = useState("");
  const classesInYear = useMemo(() => classes.filter((c) => c.academicYearId === academicYearId), [classes, academicYearId]);

  if (state.success) {
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Setujui pendaftaran — {application.fullName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="applicationId" value={application.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">Nama depan</Label>
              <Input id="firstName" name="firstName" defaultValue={firstName} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Nama belakang</Label>
              <Input id="lastName" name="lastName" defaultValue={lastName} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admissionNumber">Nomor induk</Label>
              <Input id="admissionNumber" name="admissionNumber" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="enrollmentDate">Tanggal masuk</Label>
              <Input id="enrollmentDate" name="enrollmentDate" type="date" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tahun ajaran</Label>
              <Select
                name="academicYearId"
                required
                value={academicYearId}
                onValueChange={(v) => setAcademicYearId(v as string)}
                items={Object.fromEntries(academicYears.map((y) => [y.id, y.name]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Kelas</Label>
              <Select
                name="classId"
                required
                items={Object.fromEntries(classesInYear.map((c) => [c.id, `${c.name}${c.section ? ` ${c.section}` : ""}`]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classesInYear.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.section ? ` ${c.section}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "Memproses…" : "Setujui & Daftarkan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ application, open, onOpenChange }: { application: Application; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(rejectApplicationAction, initialRejectState);

  if (state.success) {
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak pendaftaran — {application.fullName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="applicationId" value={application.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Alasan penolakan</Label>
            <Input id="reason" name="reason" required />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" variant="destructive" disabled={pending} className="w-fit">
            {pending ? "Memproses…" : "Tolak Pendaftaran"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RegistrationQueueTable({
  applications,
  classes,
  academicYears,
}: {
  applications: Application[];
  classes: { id: string; name: string; section: string | null; academicYearId: string }[];
  academicYears: { id: string; name: string }[];
}) {
  const [approveTarget, setApproveTarget] = useState<Application | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>NISN</TableHead>
            <TableHead>NIK</TableHead>
            <TableHead>Tanggal Daftar</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>{app.fullName}</TableCell>
              <TableCell>{app.nisn}</TableCell>
              <TableCell>{app.nik}</TableCell>
              <TableCell>{app.submittedAt.toLocaleDateString("id-ID")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setApproveTarget(app)}>
                    Setujui
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectTarget(app)}>
                    Tolak
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {applications.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Tidak ada pendaftaran yang menunggu
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {approveTarget && (
        <ApproveDialog
          application={approveTarget}
          classes={classes}
          academicYears={academicYears}
          open={!!approveTarget}
          onOpenChange={(open) => !open && setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectDialog application={rejectTarget} open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)} />
      )}
    </>
  );
}
