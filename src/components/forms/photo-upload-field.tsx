"use client";

import { useRef, useState } from "react";

import { requestUploadUrlAction, confirmUploadAction } from "@/server/controllers/media-controller";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { MediaEntityType } from "@/lib/db/schema";

export function PhotoUploadField({
  entityType,
  entityId,
  name,
  initialStorageKey,
  initialUpdatedAt,
  revalidateTarget,
}: {
  entityType: MediaEntityType;
  entityId: string;
  name: string;
  initialStorageKey?: string | null;
  initialUpdatedAt?: Date | string | number | null;
  revalidateTarget: string;
}) {
  const [storageKey, setStorageKey] = useState(initialStorageKey ?? null);
  // Storage key is stable across re-uploads (see media.ts), so the avatar
  // URL needs its own version bump on each successful upload — otherwise
  // the browser keeps showing its cached response for that same URL.
  const [version, setVersion] = useState<Date | string | number | null | undefined>(initialUpdatedAt);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const { uploadUrl, key } = await requestUploadUrlAction(entityType, entityId, file.type);
      const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Unggah gagal");
      await confirmUploadAction(entityType, entityId, key, file.type, revalidateTarget);
      setStorageKey(key);
      setVersion(Date.now());
    } catch {
      setError("Gagal mengunggah foto");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <EntityAvatar storageKey={storageKey} name={name} size="lg" updatedAt={version} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="photo-upload" className="text-xs text-muted-foreground">
          Foto (opsional)
        </Label>
        <input
          ref={inputRef}
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Mengunggah…" : storageKey ? "Ganti foto" : "Unggah foto"}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
