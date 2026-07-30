"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function FileUploadField({
  label,
  accept,
  maxBytes,
  requestUploadUrl,
  onUploaded,
}: {
  label: string;
  accept: string;
  maxBytes: number;
  requestUploadUrl: (contentType: string) => Promise<{ uploadUrl: string; key: string }>;
  onUploaded: (key: string, fileName: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > maxBytes) {
      setError(`Ukuran file maksimal ${Math.floor(maxBytes / (1024 * 1024))}MB`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setPending(true);
    try {
      const { uploadUrl, key } = await requestUploadUrl(file.type);
      const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Unggah gagal");
      setFileName(file.name);
      onUploaded(key, file.name);
    } catch {
      setError("Gagal mengunggah file");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" id={`file-upload-${label}`} />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Mengunggah…" : fileName ? "Ganti file" : "Unggah file"}
        </Button>
        {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
