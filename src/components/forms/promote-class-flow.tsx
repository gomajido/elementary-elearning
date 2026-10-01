"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { promoteClassAction } from "@/server/controllers/promotion-controller";
import type { PromotionAction } from "@/server/services/academic-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ACTION_LABELS: Record<PromotionAction, string> = {
  promote: "Naik kelas",
  repeat: "Tinggal kelas",
  withdraw: "Keluar",
};

type RosterStudent = { id: string; firstName: string; lastName: string; admissionNumber: string };
type ClassOption = { id: string; name: string; section: string | null; academicYearId: string };

type PromotionResult = {
  succeeded: { studentId: string; action: PromotionAction }[];
  failed: { studentId: string; error: string }[];
};

function classLabel(c: ClassOption) {
  return `${c.name}${c.section ? ` ${c.section}` : ""}`;
}

export function PromoteClassFlow({
  sourceClass,
  roster,
  classes,
  academicYears,
}: {
  sourceClass: { id: string; name: string; section: string | null };
  roster: RosterStudent[];
  classes: ClassOption[];
  academicYears: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [toAcademicYearId, setToAcademicYearId] = useState("");
  const [defaultToClassId, setDefaultToClassId] = useState("");
  const [enrolledAt, setEnrolledAt] = useState("");
  const [overrides, setOverrides] = useState<Record<string, { action: PromotionAction; toClassId?: string }>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromotionResult | null>(null);

  const classesInTargetYear = useMemo(
    () => classes.filter((c) => c.academicYearId === toAcademicYearId),
    [classes, toAcademicYearId]
  );

  const studentById = useMemo(() => Object.fromEntries(roster.map((s) => [s.id, s])), [roster]);

  function setRowAction(studentId: string, action: PromotionAction) {
    setOverrides((prev) => ({ ...prev, [studentId]: { action, toClassId: action === "repeat" ? prev[studentId]?.toClassId : undefined } }));
  }

  function setRowTargetClass(studentId: string, toClassId: string) {
    setOverrides((prev) => ({ ...prev, [studentId]: { action: "repeat", toClassId } }));
  }

  async function handleSubmit() {
    setError(null);
    setResult(null);

    if (!toAcademicYearId || !defaultToClassId || !enrolledAt) {
      setError("Lengkapi tahun ajaran tujuan, kelas tujuan default, dan tanggal");
      return;
    }
    const missingTarget = roster.some((s) => overrides[s.id]?.action === "repeat" && !overrides[s.id]?.toClassId);
    if (missingTarget) {
      setError("Pilih kelas tujuan untuk setiap siswa yang tinggal kelas");
      return;
    }

    setPending(true);
    try {
      const overridesPayload = roster
        .map((s) => ({ studentId: s.id, ...overrides[s.id] }))
        .filter((o): o is { studentId: string; action: PromotionAction; toClassId?: string } => o.action !== undefined && o.action !== "promote");

      const res = await promoteClassAction({
        fromClassId: sourceClass.id,
        toAcademicYearId,
        defaultToClassId,
        enrolledAt,
        overrides: overridesPayload,
      });
      setResult(res);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses promosi");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>Tahun ajaran tujuan</Label>
          <Select
            value={toAcademicYearId}
            onValueChange={(v) => {
              setToAcademicYearId(v as string);
              setDefaultToClassId("");
            }}
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
          <Label>Kelas tujuan (default)</Label>
          <Select
            value={defaultToClassId}
            onValueChange={(v) => setDefaultToClassId(v as string)}
            items={Object.fromEntries(classesInTargetYear.map((c) => [c.id, classLabel(c)]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {classesInTargetYear.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {classLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="enrolledAt">Tanggal</Label>
          <Input id="enrolledAt" type="date" value={enrolledAt} onChange={(e) => setEnrolledAt(e.target.value)} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Induk</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Aksi</TableHead>
            <TableHead>Kelas tujuan (jika tinggal kelas)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.map((student) => {
            const action = overrides[student.id]?.action ?? "promote";
            return (
              <TableRow key={student.id}>
                <TableCell>{student.admissionNumber}</TableCell>
                <TableCell>
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>
                  <Select
                    value={action}
                    onValueChange={(v) => setRowAction(student.id, v as PromotionAction)}
                    items={Object.fromEntries((Object.keys(ACTION_LABELS) as PromotionAction[]).map((a) => [a, ACTION_LABELS[a]]))}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ACTION_LABELS) as PromotionAction[]).map((a) => (
                        <SelectItem key={a} value={a}>
                          {ACTION_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {action === "repeat" && (
                    <Select
                      value={overrides[student.id]?.toClassId ?? ""}
                      onValueChange={(v) => setRowTargetClass(student.id, v as string)}
                      items={Object.fromEntries(classesInTargetYear.map((c) => [c.id, classLabel(c)]))}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {classesInTargetYear.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {classLabel(c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {roster.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Kelas ini belum memiliki siswa
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleSubmit} disabled={pending || roster.length === 0} className="w-fit">
        {pending ? "Memproses…" : `Promosikan ${roster.length} Siswa`}
      </Button>

      {result && (
        <div className="flex flex-col gap-3 rounded-md border p-4">
          <p className="text-sm font-medium">{result.succeeded.length} siswa berhasil diproses.</p>
          {result.failed.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kesalahan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.failed.map((f, i) => {
                  const student = studentById[f.studentId];
                  return (
                    <TableRow key={i}>
                      <TableCell>{student ? `${student.firstName} ${student.lastName}` : f.studentId}</TableCell>
                      <TableCell className="text-destructive">{f.error}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
