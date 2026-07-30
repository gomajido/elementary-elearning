"use client";

import { useActionState } from "react";

import { updateGuardianAction, type UpdateGuardianState } from "@/server/controllers/guardian-controller";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: UpdateGuardianState = {};

const RELATIONSHIPS = [
  { value: "mother", label: "Ibu" },
  { value: "father", label: "Ayah" },
  { value: "guardian", label: "Wali" },
  { value: "other", label: "Lainnya" },
] as const;

export function EditGuardianForm({
  guardian,
  photoStorageKey,
  photoUpdatedAt,
}: {
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    relationshipType: "mother" | "father" | "guardian" | "other";
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  photoStorageKey?: string | null;
  photoUpdatedAt?: Date | null;
}) {
  const [state, formAction, pending] = useActionState(updateGuardianAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="guardianId" value={guardian.id} />
      <PhotoUploadField
        entityType="guardian"
        entityId={guardian.id}
        name={`${guardian.firstName} ${guardian.lastName}`}
        initialStorageKey={photoStorageKey}
        initialUpdatedAt={photoUpdatedAt}
        revalidateTarget="/admin/guardians"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">Nama depan</Label>
          <Input id="firstName" name="firstName" defaultValue={guardian.firstName} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Nama belakang</Label>
          <Input id="lastName" name="lastName" defaultValue={guardian.lastName} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Hubungan</Label>
          <Select
            key={guardian.relationshipType}
            name="relationshipType"
            required
            defaultValue={guardian.relationshipType}
            items={Object.fromEntries(RELATIONSHIPS.map((r) => [r.value, r.label]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telepon (opsional)</Label>
          <Input id="phone" name="phone" defaultValue={guardian.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email (opsional)</Label>
          <Input id="email" name="email" type="email" defaultValue={guardian.email ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Alamat (opsional)</Label>
          <Input id="address" name="address" defaultValue={guardian.address ?? ""} />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
