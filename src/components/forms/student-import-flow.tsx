"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  previewStudentImportAction,
  confirmStudentImportAction,
  type StudentImportPreview,
  type StudentImportResult,
} from "@/server/controllers/student-import-controller";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImportPreviewTable } from "@/components/tables/import-preview-table";
import { ImportResultsTable } from "@/components/tables/import-results-table";

const TEMPLATE_HEADER =
  "admissionNumber,firstName,lastName,dateOfBirth,gender,className,section,enrollmentDate,guardian1FirstName,guardian1LastName,guardian1Relationship,guardian1Phone,guardian1Email,guardian2FirstName,guardian2LastName,guardian2Relationship,guardian2Phone,guardian2Email";
const TEMPLATE_EXAMPLE =
  "S2026001,Budi,Santoso,2015-05-10,male,Primary 3,A,2026-01-05,Siti,Santoso,mother,08123456789,siti@example.com,,,,,";

function downloadCsv(filename: string, rows: string[]) {
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StudentImportFlow({ academicYears }: { academicYears: { id: string; name: string }[] }) {
  const router = useRouter();
  const [stage, setStage] = useState<"upload" | "preview" | "results">("upload");
  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<StudentImportPreview | null>(null);
  const [results, setResults] = useState<StudentImportResult | null>(null);

  async function handlePreview() {
    if (!file || !academicYearId) return;
    setPending(true);
    setError(null);
    try {
      const csvText = await file.text();
      const result = await previewStudentImportAction(csvText, academicYearId);
      setPreview(result);
      setStage("preview");
    } catch {
      setError("Gagal membaca file CSV");
    } finally {
      setPending(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setPending(true);
    try {
      const result = await confirmStudentImportAction(preview.valid);
      setResults(result);
      setStage("results");
    } finally {
      setPending(false);
    }
  }

  function handleDownloadCredentials() {
    if (!results) return;
    const rows = [
      "name,username,tempPassword",
      ...results.succeeded.map((r) => `${r.name},${r.username ?? ""},${r.tempPassword ?? ""}`),
    ];
    downloadCsv("kredensial-siswa.csv", rows);
  }

  if (stage === "results" && results) {
    return (
      <div className="flex flex-col gap-4">
        <ImportResultsTable
          succeeded={results.succeeded.map((r) => ({ label: r.name, username: r.username, tempPassword: r.tempPassword }))}
          failed={results.failed.map((f) => ({ label: `${f.row.firstName} ${f.row.lastName}`, error: f.error }))}
        />
        <div className="flex gap-2">
          {results.succeeded.length > 0 && (
            <Button variant="outline" onClick={handleDownloadCredentials}>
              Unduh Kredensial CSV
            </Button>
          )}
          <Button onClick={() => router.push("/admin/students")}>Selesai</Button>
        </div>
      </div>
    );
  }

  if (stage === "preview" && preview) {
    return (
      <div className="flex flex-col gap-4">
        <ImportPreviewTable
          validRows={preview.valid.map((r) => ({
            rowNumber: r.rowNumber,
            label: `${r.firstName} ${r.lastName} (${r.admissionNumber})`,
          }))}
          invalidRows={preview.invalid.map((r) => ({
            rowNumber: r.rowNumber,
            label: `${r.raw.firstName ?? ""} ${r.raw.lastName ?? ""}`.trim() || "—",
            errors: r.errors,
          }))}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStage("upload")} disabled={pending}>
            Kembali
          </Button>
          <Button onClick={handleConfirm} disabled={pending || preview.valid.length === 0}>
            {pending ? "Menyimpan…" : `Impor ${preview.valid.length} Siswa`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="academicYearId">Tahun Ajaran</Label>
        <Select
          value={academicYearId}
          onValueChange={(v) => setAcademicYearId(v as string)}
          items={Object.fromEntries(academicYears.map((y) => [y.id, y.name]))}
        >
          <SelectTrigger id="academicYearId">
            <SelectValue placeholder="Pilih tahun ajaran" />
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
        <Label htmlFor="file">File CSV</Label>
        <input id="file" type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </div>
      <Button
        type="button"
        variant="link"
        className="w-fit px-0"
        onClick={() => downloadCsv("template-siswa.csv", [TEMPLATE_HEADER, TEMPLATE_EXAMPLE])}
      >
        Unduh Template CSV
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handlePreview} disabled={!file || !academicYearId || pending} className="w-fit">
        {pending ? "Memproses…" : "Pratinjau"}
      </Button>
    </div>
  );
}
