"use client";

import { useRef, useState } from "react";

import { submitRegistrationApplicationAction } from "@/server/controllers/registration-controller";
import { TurnstileWidget } from "@/components/forms/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GENDER_LABELS, label } from "@/lib/labels";
import { GENDERS } from "@/lib/db/schema";

type Achievement = { type: string; level: string; name: string; year: string; organizer: string };
type NonformalEducation = { type: string; organizerOrSource: string; startYear: string; endYear: string };

const EMPTY_ACHIEVEMENT: Achievement = { type: "", level: "", name: "", year: "", organizer: "" };
const EMPTY_NONFORMAL: NonformalEducation = { type: "", organizerOrSource: "", startYear: "", endYear: "" };

const NUMERIC_FIELDS = [
  "fatherBirthYear",
  "motherBirthYear",
  "guardianBirthYear",
  "heightCm",
  "weightKg",
  "distanceToSchoolKm",
  "travelTimeMinutes",
  "siblingCount",
] as const;

const TEXT_FIELD_NAMES = [
  "appliedGradeLevel",
  "appliedProgram",
  "fullName",
  "gender",
  "nisn",
  "nis",
  "certificateSerialNumber",
  "skhunSerialNumber",
  "nationalExamNumber",
  "nik",
  "previousSchoolNpsn",
  "previousSchoolName",
  "placeOfBirth",
  "dateOfBirth",
  "religion",
  "specialNeeds",
  "addressDetail",
  "dusun",
  "rt",
  "rw",
  "kelurahan",
  "postalCode",
  "kecamatan",
  "kabupaten",
  "provinsi",
  "transportMode",
  "livingArrangement",
  "homePhone",
  "mobilePhone",
  "personalEmail",
  "kksRecipient",
  "kksNumber",
  "kpsRecipient",
  "kpsNumber",
  "pipEligibleReason",
  "kipRecipient",
  "kipNumber",
  "kipHolderName",
  "kipRejectReason",
  "birthCertNumber",
  "latitude",
  "longitude",
  "fatherName",
  "fatherSpecialNeeds",
  "fatherOccupation",
  "fatherEducationLevel",
  "fatherMonthlyIncome",
  "motherName",
  "motherSpecialNeeds",
  "motherOccupation",
  "motherEducationLevel",
  "motherMonthlyIncome",
  "guardianName",
  "guardianOccupation",
  "guardianEducationLevel",
  "guardianMonthlyIncome",
] as const;

type FieldName = (typeof TEXT_FIELD_NAMES)[number] | (typeof NUMERIC_FIELDS)[number];

const INITIAL_FIELDS: Record<FieldName, string> = Object.fromEntries(
  [...TEXT_FIELD_NAMES, ...NUMERIC_FIELDS].map((name) => [name, ""])
) as Record<FieldName, string>;

function TextField({
  fieldLabel,
  name,
  value,
  onChange,
  required,
  type = "text",
}: {
  fieldLabel: string;
  name: FieldName;
  value: string;
  onChange: (name: FieldName, value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>
        {fieldLabel}
        {!required && " (opsional)"}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold">{children}</h2>;
}

export function RegistrationForm() {
  const [fields, setFields] = useState<Record<FieldName, string>>(INITIAL_FIELDS);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [nonformalEducations, setNonformalEducations] = useState<NonformalEducation[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const resetTurnstile = useRef<(() => void) | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  function set(name: FieldName, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Selesaikan verifikasi keamanan terlebih dahulu");
      return;
    }
    setPending(true);
    setError(null);

    try {
      const result = await submitRegistrationApplicationAction({
        application: {
          appliedGradeLevel: fields.appliedGradeLevel || undefined,
          appliedProgram: fields.appliedProgram || undefined,
          fullName: fields.fullName,
          gender: fields.gender as "male" | "female",
          nisn: fields.nisn,
          nis: fields.nis || undefined,
          certificateSerialNumber: fields.certificateSerialNumber || undefined,
          skhunSerialNumber: fields.skhunSerialNumber || undefined,
          nationalExamNumber: fields.nationalExamNumber || undefined,
          nik: fields.nik,
          previousSchoolNpsn: fields.previousSchoolNpsn || undefined,
          previousSchoolName: fields.previousSchoolName || undefined,
          placeOfBirth: fields.placeOfBirth,
          dateOfBirth: fields.dateOfBirth,
          religion: fields.religion,
          specialNeeds: fields.specialNeeds,
          addressDetail: fields.addressDetail,
          dusun: fields.dusun || undefined,
          rt: fields.rt,
          rw: fields.rw,
          kelurahan: fields.kelurahan,
          postalCode: fields.postalCode || undefined,
          kecamatan: fields.kecamatan,
          kabupaten: fields.kabupaten,
          provinsi: fields.provinsi,
          transportMode: fields.transportMode,
          livingArrangement: fields.livingArrangement,
          homePhone: fields.homePhone || undefined,
          mobilePhone: fields.mobilePhone || undefined,
          personalEmail: fields.personalEmail || undefined,
          kksRecipient: fields.kksRecipient || undefined,
          kksNumber: fields.kksNumber || undefined,
          kpsRecipient: fields.kpsRecipient || undefined,
          kpsNumber: fields.kpsNumber || undefined,
          pipEligibleReason: fields.pipEligibleReason || undefined,
          kipRecipient: fields.kipRecipient || undefined,
          kipNumber: fields.kipNumber || undefined,
          kipHolderName: fields.kipHolderName || undefined,
          kipRejectReason: fields.kipRejectReason || undefined,
          birthCertNumber: fields.birthCertNumber,
          latitude: fields.latitude || undefined,
          longitude: fields.longitude || undefined,
          fatherName: fields.fatherName,
          fatherBirthYear: Number(fields.fatherBirthYear),
          fatherSpecialNeeds: fields.fatherSpecialNeeds,
          fatherOccupation: fields.fatherOccupation,
          fatherEducationLevel: fields.fatherEducationLevel,
          fatherMonthlyIncome: fields.fatherMonthlyIncome,
          motherName: fields.motherName,
          motherBirthYear: Number(fields.motherBirthYear),
          motherSpecialNeeds: fields.motherSpecialNeeds,
          motherOccupation: fields.motherOccupation,
          motherEducationLevel: fields.motherEducationLevel,
          motherMonthlyIncome: fields.motherMonthlyIncome,
          guardianName: fields.guardianName || undefined,
          guardianBirthYear: fields.guardianBirthYear ? Number(fields.guardianBirthYear) : undefined,
          guardianOccupation: fields.guardianOccupation || undefined,
          guardianEducationLevel: fields.guardianEducationLevel || undefined,
          guardianMonthlyIncome: fields.guardianMonthlyIncome || undefined,
          heightCm: Number(fields.heightCm),
          weightKg: Number(fields.weightKg),
          distanceToSchoolKm: Number(fields.distanceToSchoolKm),
          travelTimeMinutes: Number(fields.travelTimeMinutes),
          siblingCount: Number(fields.siblingCount),
        },
        achievements,
        nonformalEducations,
        turnstileToken: token,
      });

      if (result.error) {
        setError(result.error);
        resetTurnstile.current?.();
      } else {
        setApplicationId(result.applicationId ?? null);
      }
    } catch {
      setError("Gagal mengirim pendaftaran, silakan coba lagi");
      resetTurnstile.current?.();
    } finally {
      setPending(false);
    }
  }

  if (applicationId) {
    return (
      <div className="flex flex-col gap-2 rounded-md border p-6">
        <p className="font-medium">Pendaftaran berhasil dikirim.</p>
        <p className="text-sm text-muted-foreground">
          Nomor referensi pendaftaran: <code className="rounded bg-muted px-1.5 py-0.5">{applicationId}</code>. Pihak
          sekolah akan menghubungi Anda setelah pendaftaran diperiksa.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField fieldLabel="Tingkat yang dituju" name="appliedGradeLevel" value={fields.appliedGradeLevel} onChange={set} />
        <TextField fieldLabel="Program" name="appliedProgram" value={fields.appliedProgram} onChange={set} />
      </div>

      <Separator />
      <SectionTitle>A. Identitas Peserta Didik</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField fieldLabel="Nama Lengkap" name="fullName" value={fields.fullName} onChange={set} required />
        <div className="flex flex-col gap-2">
          <Label>Jenis Kelamin</Label>
          <Select
            name="gender"
            required
            value={fields.gender}
            onValueChange={(v) => set("gender", v as string)}
            items={Object.fromEntries(GENDERS.map((g) => [g, label(GENDER_LABELS, g)]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g} value={g}>
                  {label(GENDER_LABELS, g)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TextField fieldLabel="NISN" name="nisn" value={fields.nisn} onChange={set} required />
        <TextField fieldLabel="NIS" name="nis" value={fields.nis} onChange={set} />
        <TextField fieldLabel="NIK" name="nik" value={fields.nik} onChange={set} required />
        <TextField fieldLabel="No Registrasi Akta Lahir" name="birthCertNumber" value={fields.birthCertNumber} onChange={set} required />
        <TextField fieldLabel="Tempat Lahir" name="placeOfBirth" value={fields.placeOfBirth} onChange={set} required />
        <TextField fieldLabel="Tanggal Lahir" name="dateOfBirth" type="date" value={fields.dateOfBirth} onChange={set} required />
        <TextField fieldLabel="Agama" name="religion" value={fields.religion} onChange={set} required />
        <TextField fieldLabel="Berkebutuhan Khusus" name="specialNeeds" value={fields.specialNeeds} onChange={set} required />
      </div>

      <p className="text-sm text-muted-foreground">Data dari jenjang sebelumnya (isi jika ada):</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField fieldLabel="Nomor Seri Ijazah" name="certificateSerialNumber" value={fields.certificateSerialNumber} onChange={set} />
        <TextField fieldLabel="Nomor Seri SKHUN" name="skhunSerialNumber" value={fields.skhunSerialNumber} onChange={set} />
        <TextField fieldLabel="No. Ujian Nasional" name="nationalExamNumber" value={fields.nationalExamNumber} onChange={set} />
        <TextField fieldLabel="NPSN Sekolah Asal" name="previousSchoolNpsn" value={fields.previousSchoolNpsn} onChange={set} />
        <TextField fieldLabel="Nama Sekolah Asal" name="previousSchoolName" value={fields.previousSchoolName} onChange={set} />
      </div>

      <Separator />
      <SectionTitle>Alamat &amp; Kontak</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField fieldLabel="Alamat Tempat Tinggal" name="addressDetail" value={fields.addressDetail} onChange={set} required />
        <TextField fieldLabel="Dusun" name="dusun" value={fields.dusun} onChange={set} />
        <TextField fieldLabel="RT" name="rt" value={fields.rt} onChange={set} required />
        <TextField fieldLabel="RW" name="rw" value={fields.rw} onChange={set} required />
        <TextField fieldLabel="Kelurahan/Desa" name="kelurahan" value={fields.kelurahan} onChange={set} required />
        <TextField fieldLabel="Kode Pos" name="postalCode" value={fields.postalCode} onChange={set} />
        <TextField fieldLabel="Kecamatan" name="kecamatan" value={fields.kecamatan} onChange={set} required />
        <TextField fieldLabel="Kabupaten/Kota" name="kabupaten" value={fields.kabupaten} onChange={set} required />
        <TextField fieldLabel="Propinsi" name="provinsi" value={fields.provinsi} onChange={set} required />
        <TextField fieldLabel="Alat Transportasi ke Sekolah" name="transportMode" value={fields.transportMode} onChange={set} required />
        <TextField fieldLabel="Jenis Tinggal" name="livingArrangement" value={fields.livingArrangement} onChange={set} required />
        <TextField fieldLabel="No Telepon Rumah" name="homePhone" value={fields.homePhone} onChange={set} />
        <TextField fieldLabel="No. Hp" name="mobilePhone" value={fields.mobilePhone} onChange={set} />
        <TextField fieldLabel="Email Pribadi" name="personalEmail" type="email" value={fields.personalEmail} onChange={set} />
        <TextField fieldLabel="Lintang (GPS)" name="latitude" value={fields.latitude} onChange={set} />
        <TextField fieldLabel="Bujur (GPS)" name="longitude" value={fields.longitude} onChange={set} />
      </div>

      <p className="text-sm text-muted-foreground">Program bantuan (isi jika berlaku):</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField fieldLabel="Penerima KKS" name="kksRecipient" value={fields.kksRecipient} onChange={set} />
        <TextField fieldLabel="No. KKS" name="kksNumber" value={fields.kksNumber} onChange={set} />
        <TextField fieldLabel="Penerima KPS" name="kpsRecipient" value={fields.kpsRecipient} onChange={set} />
        <TextField fieldLabel="No. KPS" name="kpsNumber" value={fields.kpsNumber} onChange={set} />
        <TextField fieldLabel="Alasan Layak (PIP)" name="pipEligibleReason" value={fields.pipEligibleReason} onChange={set} />
        <TextField fieldLabel="Penerima KIP" name="kipRecipient" value={fields.kipRecipient} onChange={set} />
        <TextField fieldLabel="No. KIP" name="kipNumber" value={fields.kipNumber} onChange={set} />
        <TextField fieldLabel="Nama Tertera di KIP" name="kipHolderName" value={fields.kipHolderName} onChange={set} />
        <TextField fieldLabel="Alasan Menolak KIP" name="kipRejectReason" value={fields.kipRejectReason} onChange={set} />
      </div>

      <Separator />
      <SectionTitle>Data Ayah Kandung</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField fieldLabel="Nama Ayah" name="fatherName" value={fields.fatherName} onChange={set} required />
        <TextField fieldLabel="Tahun Lahir" name="fatherBirthYear" type="number" value={fields.fatherBirthYear} onChange={set} required />
        <TextField fieldLabel="Berkebutuhan Khusus" name="fatherSpecialNeeds" value={fields.fatherSpecialNeeds} onChange={set} required />
        <TextField fieldLabel="Pekerjaan" name="fatherOccupation" value={fields.fatherOccupation} onChange={set} required />
        <TextField fieldLabel="Pendidikan" name="fatherEducationLevel" value={fields.fatherEducationLevel} onChange={set} required />
        <TextField fieldLabel="Penghasilan Bulanan" name="fatherMonthlyIncome" value={fields.fatherMonthlyIncome} onChange={set} required />
      </div>

      <SectionTitle>Data Ibu Kandung</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField fieldLabel="Nama Ibu" name="motherName" value={fields.motherName} onChange={set} required />
        <TextField fieldLabel="Tahun Lahir" name="motherBirthYear" type="number" value={fields.motherBirthYear} onChange={set} required />
        <TextField fieldLabel="Berkebutuhan Khusus" name="motherSpecialNeeds" value={fields.motherSpecialNeeds} onChange={set} required />
        <TextField fieldLabel="Pekerjaan" name="motherOccupation" value={fields.motherOccupation} onChange={set} required />
        <TextField fieldLabel="Pendidikan" name="motherEducationLevel" value={fields.motherEducationLevel} onChange={set} required />
        <TextField fieldLabel="Penghasilan Bulanan" name="motherMonthlyIncome" value={fields.motherMonthlyIncome} onChange={set} required />
      </div>

      <SectionTitle>Data Wali (opsional — isi jika wali bukan orang tua kandung)</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField fieldLabel="Nama Wali" name="guardianName" value={fields.guardianName} onChange={set} />
        <TextField fieldLabel="Tahun Lahir" name="guardianBirthYear" type="number" value={fields.guardianBirthYear} onChange={set} />
        <TextField fieldLabel="Pekerjaan" name="guardianOccupation" value={fields.guardianOccupation} onChange={set} />
        <TextField fieldLabel="Pendidikan" name="guardianEducationLevel" value={fields.guardianEducationLevel} onChange={set} />
        <TextField fieldLabel="Penghasilan" name="guardianMonthlyIncome" value={fields.guardianMonthlyIncome} onChange={set} />
      </div>

      <Separator />
      <SectionTitle>Data Periodik</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField fieldLabel="Tinggi Badan (cm)" name="heightCm" type="number" value={fields.heightCm} onChange={set} required />
        <TextField fieldLabel="Berat Badan (kg)" name="weightKg" type="number" value={fields.weightKg} onChange={set} required />
        <TextField fieldLabel="Jarak ke Sekolah (km)" name="distanceToSchoolKm" type="number" value={fields.distanceToSchoolKm} onChange={set} required />
        <TextField fieldLabel="Waktu Tempuh (menit)" name="travelTimeMinutes" type="number" value={fields.travelTimeMinutes} onChange={set} required />
        <TextField fieldLabel="Jumlah Saudara Kandung" name="siblingCount" type="number" value={fields.siblingCount} onChange={set} required />
      </div>

      <Separator />
      <SectionTitle>Data Prestasi (opsional)</SectionTitle>
      <div className="flex flex-col gap-4">
        {achievements.map((a, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-6 sm:items-end">
            <Input placeholder="Jenis" value={a.type} onChange={(e) => setAchievements((prev) => prev.map((row, j) => (j === i ? { ...row, type: e.target.value } : row)))} />
            <Input placeholder="Tingkat" value={a.level} onChange={(e) => setAchievements((prev) => prev.map((row, j) => (j === i ? { ...row, level: e.target.value } : row)))} />
            <Input placeholder="Nama Prestasi" value={a.name} onChange={(e) => setAchievements((prev) => prev.map((row, j) => (j === i ? { ...row, name: e.target.value } : row)))} />
            <Input placeholder="Tahun" value={a.year} onChange={(e) => setAchievements((prev) => prev.map((row, j) => (j === i ? { ...row, year: e.target.value } : row)))} />
            <Input placeholder="Penyelenggaraan" value={a.organizer} onChange={(e) => setAchievements((prev) => prev.map((row, j) => (j === i ? { ...row, organizer: e.target.value } : row)))} />
            <Button type="button" variant="outline" size="sm" onClick={() => setAchievements((prev) => prev.filter((_, j) => j !== i))}>
              Hapus
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setAchievements((prev) => [...prev, { ...EMPTY_ACHIEVEMENT }])}>
          + Tambah Prestasi
        </Button>
      </div>

      <SectionTitle>Data Pendidikan Non-Formal (opsional)</SectionTitle>
      <div className="flex flex-col gap-4">
        {nonformalEducations.map((n, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-5 sm:items-end">
            <Input placeholder="Jenis" value={n.type} onChange={(e) => setNonformalEducations((prev) => prev.map((row, j) => (j === i ? { ...row, type: e.target.value } : row)))} />
            <Input placeholder="Penyelenggara/Sumber" value={n.organizerOrSource} onChange={(e) => setNonformalEducations((prev) => prev.map((row, j) => (j === i ? { ...row, organizerOrSource: e.target.value } : row)))} />
            <Input placeholder="Tahun Mulai" value={n.startYear} onChange={(e) => setNonformalEducations((prev) => prev.map((row, j) => (j === i ? { ...row, startYear: e.target.value } : row)))} />
            <Input placeholder="Tahun Selesai" value={n.endYear} onChange={(e) => setNonformalEducations((prev) => prev.map((row, j) => (j === i ? { ...row, endYear: e.target.value } : row)))} />
            <Button type="button" variant="outline" size="sm" onClick={() => setNonformalEducations((prev) => prev.filter((_, j) => j !== i))}>
              Hapus
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setNonformalEducations((prev) => [...prev, { ...EMPTY_NONFORMAL }])}
        >
          + Tambah Pendidikan Non-Formal
        </Button>
      </div>

      <Separator />
      <TurnstileWidget onToken={setToken} resetRef={resetTurnstile} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending || !token} className="w-fit">
        {pending ? "Mengirim…" : "Kirim Pendaftaran"}
      </Button>
    </form>
  );
}
