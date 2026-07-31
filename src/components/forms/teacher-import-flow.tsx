"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  previewTeacherImportAction,
  confirmTeacherImportAction,
  type TeacherImportPreview,
  type TeacherImportResult,
} from "@/server/controllers/teacher-import-controller";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImportPreviewTable } from "@/components/tables/import-preview-table";
import { ImportResultsTable } from "@/components/tables/import-results-table";

const TEMPLATE_HEADER = "email,firstName,lastName,employeeNumber,phone,hireDate";
const TEMPLATE_EXAMPLE = "budi.guru@example.com,Budi,Santoso,T2026001,08123456789,2026-01-05";

function downloadCsv(filename: string, rows: string[]) {
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TeacherImportFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<"upload" | "preview" | "results">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TeacherImportPreview | null>(null);
  const [results, setResults] = useState<TeacherImportResult | null>(null);

  async function handlePreview() {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const csvText = await file.text();
      const result = await previewTeacherImportAction(csvText);
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
      const result = await confirmTeacherImportAction(preview.valid);
      setResults(result);
      setStage("results");
    } finally {
      setPending(false);
    }
  }

  function handleDownloadCredentials() {
    if (!results) return;
    const rows = [
      "name,email,tempPassword",
      ...results.succeeded.map((r) => `${r.name},${r.email},${r.tempPassword}`),
    ];
    downloadCsv("kredensial-guru.csv", rows);
  }

  if (stage === "results" && results) {
    return (
      <div className="flex flex-col gap-4">
        <ImportResultsTable
          succeeded={results.succeeded.map((r) => ({ label: r.name, username: r.employeeNumber, tempPassword: r.tempPassword }))}
          failed={results.failed.map((f) => ({ label: `${f.row.firstName} ${f.row.lastName}`, error: f.error }))}
        />
        <div className="flex gap-2">
          {results.succeeded.length > 0 && (
            <Button variant="outline" onClick={handleDownloadCredentials}>
              Unduh Kredensial CSV
            </Button>
          )}
          <Button onClick={() => router.push("/admin/teachers")}>Selesai</Button>
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
            label: `${r.firstName} ${r.lastName} (${r.employeeNumber})`,
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
            {pending ? "Menyimpan…" : `Impor ${preview.valid.length} Guru`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">File CSV</Label>
        <input id="file" type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </div>
      <Button
        type="button"
        variant="link"
        className="w-fit px-0"
        onClick={() => downloadCsv("template-guru.csv", [TEMPLATE_HEADER, TEMPLATE_EXAMPLE])}
      >
        Unduh Template CSV
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handlePreview} disabled={!file || pending} className="w-fit">
        {pending ? "Memproses…" : "Pratinjau"}
      </Button>
    </div>
  );
}
