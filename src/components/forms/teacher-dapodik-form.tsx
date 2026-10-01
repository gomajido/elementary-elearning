"use client";

import { useActionState, useEffect } from "react";

import { updateTeacherDapodikProfileAction, type UpdateDapodikState } from "@/server/controllers/teacher-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MARITAL_STATUSES,
  EMPLOYMENT_STATUSES,
  SALARY_SOURCES,
  type teachers,
} from "@/lib/db/schema";
import { MARITAL_STATUS_LABELS, EMPLOYMENT_STATUS_LABELS, SALARY_SOURCE_LABELS, label } from "@/lib/labels";

type Teacher = typeof teachers.$inferSelect;

const initialState: UpdateDapodikState = {};

function Field({
  fieldLabel,
  name,
  defaultValue,
  type = "text",
}: {
  fieldLabel: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{fieldLabel}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

function EnumField({
  fieldLabel,
  name,
  defaultValue,
  options,
  optionLabels,
}: {
  fieldLabel: string;
  name: string;
  defaultValue?: string | null;
  options: readonly string[];
  optionLabels: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{fieldLabel}</Label>
      <Select
        key={defaultValue}
        name={name}
        defaultValue={defaultValue ?? undefined}
        items={Object.fromEntries(options.map((o) => [o, label(optionLabels, o)]))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Pilih" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {label(optionLabels, o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CheckboxField({ fieldLabel, name, defaultChecked }: { fieldLabel: string; name: string; defaultChecked?: boolean | null }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked ?? false} />
      {fieldLabel}
    </label>
  );
}

export function TeacherDapodikForm({ teacher, onSuccess }: { teacher: Teacher; onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(updateTeacherDapodikProfileAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto pr-1">
      <input type="hidden" name="teacherId" value={teacher.id} />

      <p className="text-sm font-semibold">Identitas Pendidik</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field fieldLabel="Tempat Lahir" name="placeOfBirth" defaultValue={teacher.placeOfBirth} />
        <Field fieldLabel="Tanggal Lahir" name="dateOfBirth" type="date" defaultValue={teacher.dateOfBirth} />
        <Field fieldLabel="Nama Ibu Kandung" name="motherName" defaultValue={teacher.motherName} />
        <Field fieldLabel="NIK" name="nik" defaultValue={teacher.nik} />
        <Field fieldLabel="NPWP" name="npwp" defaultValue={teacher.npwp} />
        <Field fieldLabel="Nama Wajib Pajak" name="taxpayerName" defaultValue={teacher.taxpayerName} />
        <EnumField
          fieldLabel="Status Kawin"
          name="maritalStatus"
          defaultValue={teacher.maritalStatus}
          options={MARITAL_STATUSES}
          optionLabels={MARITAL_STATUS_LABELS}
        />
        <Field fieldLabel="Nama Suami/Istri" name="spouseName" defaultValue={teacher.spouseName} />
        <Field fieldLabel="Pekerjaan Suami/Istri" name="spouseOccupation" defaultValue={teacher.spouseOccupation} />
      </div>

      <p className="text-sm font-medium">Alamat</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field fieldLabel="Alamat Tempat Tinggal" name="addressDetail" defaultValue={teacher.addressDetail} />
        <Field fieldLabel="Dusun" name="dusun" defaultValue={teacher.dusun} />
        <Field fieldLabel="RT" name="rt" defaultValue={teacher.rt} />
        <Field fieldLabel="RW" name="rw" defaultValue={teacher.rw} />
        <Field fieldLabel="Kelurahan/Desa" name="kelurahan" defaultValue={teacher.kelurahan} />
        <Field fieldLabel="Kode Pos" name="postalCode" defaultValue={teacher.postalCode} />
        <Field fieldLabel="Kecamatan" name="kecamatan" defaultValue={teacher.kecamatan} />
        <Field fieldLabel="Kabupaten/Kota" name="kabupaten" defaultValue={teacher.kabupaten} />
        <Field fieldLabel="Propinsi" name="provinsi" defaultValue={teacher.provinsi} />
      </div>

      <Separator />
      <p className="text-sm font-semibold">Kepegawaian</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <EnumField
          fieldLabel="Status Pegawai"
          name="employmentStatus"
          defaultValue={teacher.employmentStatus}
          options={EMPLOYMENT_STATUSES}
          optionLabels={EMPLOYMENT_STATUS_LABELS}
        />
        <Field fieldLabel="Jenis PTK" name="ptkType" defaultValue={teacher.ptkType} />
        <Field fieldLabel="N I Y / N I G K" name="niyNigk" defaultValue={teacher.niyNigk} />
        <Field fieldLabel="N I G B" name="nigb" defaultValue={teacher.nigb} />
        <Field fieldLabel="N I P (PNS)" name="nip" defaultValue={teacher.nip} />
        <Field fieldLabel="N U P T K" name="nuptk" defaultValue={teacher.nuptk} />
        <Field fieldLabel="SK Pengangkatan" name="appointmentDecreeNumber" defaultValue={teacher.appointmentDecreeNumber} />
        <Field fieldLabel="TMT Pengangkatan" name="appointmentEffectiveDate" type="date" defaultValue={teacher.appointmentEffectiveDate} />
        <Field fieldLabel="Lembaga Pengangkat" name="appointmentDecreeIssuer" defaultValue={teacher.appointmentDecreeIssuer} />
        <Field fieldLabel="SK CPNS (jika PNS)" name="cpnsDecreeNumber" defaultValue={teacher.cpnsDecreeNumber} />
        <Field fieldLabel="TMT CPNS" name="cpnsEffectiveDate" type="date" defaultValue={teacher.cpnsEffectiveDate} />
        <Field fieldLabel="TMT PNS" name="pnsEffectiveDate" type="date" defaultValue={teacher.pnsEffectiveDate} />
        <Field fieldLabel="Pangkat/Golongan" name="rankGrade" defaultValue={teacher.rankGrade} />
        <EnumField
          fieldLabel="Sumber Gaji"
          name="salarySource"
          defaultValue={teacher.salarySource}
          options={SALARY_SOURCES}
          optionLabels={SALARY_SOURCE_LABELS}
        />
        <CheckboxField fieldLabel="Status Aktif" name="isActive" defaultChecked={teacher.isActive} />
      </div>

      <Separator />
      <p className="text-sm font-semibold">Penugasan</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field fieldLabel="No Surat Tugas" name="assignmentLetterNumber" defaultValue={teacher.assignmentLetterNumber} />
        <Field fieldLabel="Tgl Surat Tugas" name="assignmentLetterDate" type="date" defaultValue={teacher.assignmentLetterDate} />
        <Field fieldLabel="TMT Tugas" name="assignmentEffectiveDate" type="date" defaultValue={teacher.assignmentEffectiveDate} />
        <CheckboxField fieldLabel="Sekolah Induk" name="isHomeSchool" defaultChecked={teacher.isHomeSchool} />
      </div>

      <Separator />
      <p className="text-sm font-semibold">Kompetensi Khusus (opsional, sesuai jabatan)</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <CheckboxField fieldLabel="Lisensi Kepala Sekolah" name="isPrincipalLicensed" defaultChecked={teacher.isPrincipalLicensed} />
        <Field fieldLabel="Kode Program Keahlian" name="vocationalProgramCode" defaultValue={teacher.vocationalProgramCode} />
        <Field fieldLabel="Jenis Ketunaan yang Ditangani" name="specialNeedsTypesHandled" defaultValue={teacher.specialNeedsTypesHandled} />
        <Field fieldLabel="Spesialisasi Kebutuhan Khusus" name="specialNeedsSpecialization" defaultValue={teacher.specialNeedsSpecialization} />
        <Field fieldLabel="Keahlian Khusus" name="specialNeedsSkills" defaultValue={teacher.specialNeedsSkills} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan Data Dapodik"}
      </Button>
    </form>
  );
}
