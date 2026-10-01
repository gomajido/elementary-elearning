"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  requestAttendanceImportUploadAction,
  previewAttendanceImportAction,
  confirmAttendanceImportAction,
  type AttendanceImportPreview,
  type AttendanceImportResult,
} from "@/server/controllers/attendance-import-controller";
import type { ImportTarget, ResolvedImportRow } from "@/server/services/attendance-import-service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function AttendanceImportFlow({
  students,
  teachers,
}: {
  students: { id: string; firstName: string; lastName: string }[];
  teachers: { id: string; firstName: string; lastName: string }[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<ImportTarget>("student");
  const [stage, setStage] = useState<"upload" | "preview" | "results">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AttendanceImportPreview | null>(null);
  const [manualMatches, setManualMatches] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttendanceImportResult | null>(null);

  function resetFlow(nextTarget: ImportTarget) {
    setTarget(nextTarget);
    setStage("upload");
    setFile(null);
    setError(null);
    setPreview(null);
    setManualMatches({});
    setResult(null);
  }

  async function handlePreview() {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const { uploadUrl, key } = await requestAttendanceImportUploadAction(file.type || XLSX_CONTENT_TYPE);
      const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": XLSX_CONTENT_TYPE }, body: file });
      if (!uploadRes.ok) throw new Error("Gagal mengunggah file");
      const result = await previewAttendanceImportAction(target, key);
      setPreview(result);
      setStage("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses file");
    } finally {
      setPending(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setPending(true);
    setError(null);
    try {
      const resolvedRows: ResolvedImportRow[] = [
        ...preview.matched.map((m) => ({ fingerprintId: m.fingerprintId, personId: m.personId, days: m.days })),
        ...preview.unmatched
          .filter((u) => manualMatches[u.fingerprintId])
          .map((u) => ({ fingerprintId: u.fingerprintId, personId: manualMatches[u.fingerprintId], days: u.days })),
      ];
      const res = await confirmAttendanceImportAction(target, resolvedRows);
      setResult(res);
      setStage("results");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengimpor data");
    } finally {
      setPending(false);
    }
  }

  const people = target === "student" ? students : teachers;
  const peopleById = Object.fromEntries(people.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  const unresolvedCount = preview ? preview.unmatched.filter((u) => !manualMatches[u.fingerprintId]).length : 0;

  if (stage === "results" && result) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium">{result.succeeded.length} data berhasil diimpor.</p>
        {result.failed.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kesalahan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.failed.map((f, i) => (
                <TableRow key={i}>
                  <TableCell>{peopleById[f.personId] ?? f.personId}</TableCell>
                  <TableCell className="text-destructive">{f.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Button className="w-fit" onClick={() => resetFlow(target)}>
          Impor File Lain
        </Button>
      </div>
    );
  }

  if (stage === "preview" && preview) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium">Cocok otomatis ({preview.matched.length})</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Fingerprint</TableHead>
                <TableHead>Nama di Mesin</TableHead>
                <TableHead>Tercatat Sebagai</TableHead>
                <TableHead>Jumlah Hari</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.matched.map((m) => (
                <TableRow key={m.fingerprintId}>
                  <TableCell>{m.fingerprintId}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{peopleById[m.personId] ?? "—"}</TableCell>
                  <TableCell>{m.dayCount}</TableCell>
                </TableRow>
              ))}
              {preview.matched.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Tidak ada yang cocok otomatis
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {preview.unmatched.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Belum cocok — pilih secara manual ({preview.unmatched.length})</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Fingerprint</TableHead>
                  <TableHead>Nama di Mesin</TableHead>
                  <TableHead>Cocokkan dengan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.unmatched.map((u) => (
                  <TableRow key={u.fingerprintId}>
                    <TableCell>{u.fingerprintId}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>
                      <Select
                        value={manualMatches[u.fingerprintId] ?? ""}
                        onValueChange={(v) => setManualMatches((prev) => ({ ...prev, [u.fingerprintId]: v as string }))}
                        items={Object.fromEntries(people.map((p) => [p.id, `${p.firstName} ${p.lastName}`]))}
                      >
                        <SelectTrigger size="sm">
                          <SelectValue placeholder="Pilih..." />
                        </SelectTrigger>
                        <SelectContent>
                          {people.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.firstName} {p.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {unresolvedCount > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {unresolvedCount} data belum dicocokkan akan dilewati saat impor.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStage("upload")} disabled={pending}>
            Kembali
          </Button>
          <Button onClick={handleConfirm} disabled={pending || preview.matched.length + (preview.unmatched.length - unresolvedCount) === 0}>
            {pending ? "Mengimpor…" : "Impor Data"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="target" checked={target === "student"} onChange={() => resetFlow("student")} />
          Siswa
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="target" checked={target === "teacher"} onChange={() => resetFlow("teacher")} />
          Guru
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">File Excel (.xlsx) dari mesin fingerprint</Label>
        <input
          id="file"
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handlePreview} disabled={!file || pending} className="w-fit">
        {pending ? "Memproses…" : "Pratinjau"}
      </Button>
    </div>
  );
}
