import { z } from "zod";

import { GENDERS } from "@/lib/db/schema";

// Mandatory/optional split verified against the real Dapodik F-PD form (see
// docs/client_request/23September2026/TSD-01-student-registration.md): every
// section except "DATA WALI" is marked "(WAJIB DIISI)" on the form itself,
// with four explicit exceptions for fields the form's own footnote marks
// "diisikan data dari jenjang sebelumnya" (only apply to a transfer
// student), plus the assistance-program fields and GPS coordinates, which
// can't reasonably be mandatory for a family that doesn't have them.
export const registrationApplicationSchema = z.object({
  appliedGradeLevel: z.string().optional(),
  appliedProgram: z.string().optional(),

  fullName: z.string().min(1),
  gender: z.enum(GENDERS),
  nisn: z.string().length(10, "NISN harus 10 digit"),
  nis: z.string().optional(),
  certificateSerialNumber: z.string().optional(),
  skhunSerialNumber: z.string().optional(),
  nationalExamNumber: z.string().optional(),
  nik: z.string().length(16, "NIK harus 16 digit"),
  previousSchoolNpsn: z.string().optional(),
  previousSchoolName: z.string().optional(),
  placeOfBirth: z.string().min(1),
  dateOfBirth: z.string().min(1),
  religion: z.string().min(1),
  specialNeeds: z.string().min(1),

  addressDetail: z.string().min(1),
  dusun: z.string().optional(),
  rt: z.string().regex(/^\d{1,3}$/, "RT harus 1-3 digit angka"),
  rw: z.string().regex(/^\d{1,3}$/, "RW harus 1-3 digit angka"),
  kelurahan: z.string().min(1),
  postalCode: z.string().regex(/^\d{5}$/, "Kode pos harus 5 digit").optional().or(z.literal("")),
  kecamatan: z.string().min(1),
  kabupaten: z.string().min(1),
  provinsi: z.string().min(1),
  transportMode: z.string().min(1),
  livingArrangement: z.string().min(1),
  homePhone: z.string().regex(/^\d{6,15}$/, "No telepon rumah harus 6-15 digit angka").optional().or(z.literal("")),
  mobilePhone: z.string().regex(/^\d{9,13}$/, "No. Hp harus 9-13 digit angka").optional().or(z.literal("")),
  personalEmail: z.string().email().optional().or(z.literal("")),

  kksRecipient: z.string().optional(),
  kksNumber: z.string().optional(),
  kpsRecipient: z.string().optional(),
  kpsNumber: z.string().optional(),
  pipEligibleReason: z.string().optional(),
  kipRecipient: z.string().optional(),
  kipNumber: z.string().optional(),
  kipHolderName: z.string().optional(),
  kipRejectReason: z.string().optional(),

  birthCertNumber: z.string().min(1),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  fatherName: z.string().min(1),
  fatherBirthYear: z.coerce
    .number({ error: "Tahun lahir ayah wajib berupa angka" })
    .int("Tahun lahir ayah harus bilangan bulat")
    .min(1900, "Tahun lahir ayah tidak valid")
    .max(2100, "Tahun lahir ayah tidak valid"),
  fatherSpecialNeeds: z.string().min(1),
  fatherOccupation: z.string().min(1),
  fatherEducationLevel: z.string().min(1),
  fatherMonthlyIncome: z.string().min(1),

  motherName: z.string().min(1),
  motherBirthYear: z.coerce
    .number({ error: "Tahun lahir ibu wajib berupa angka" })
    .int("Tahun lahir ibu harus bilangan bulat")
    .min(1900, "Tahun lahir ibu tidak valid")
    .max(2100, "Tahun lahir ibu tidak valid"),
  motherSpecialNeeds: z.string().min(1),
  motherOccupation: z.string().min(1),
  motherEducationLevel: z.string().min(1),
  motherMonthlyIncome: z.string().min(1),

  // DATA WALI — the only section not marked mandatory on the real form.
  guardianName: z.string().optional(),
  guardianBirthYear: z.coerce
    .number({ error: "Tahun lahir wali wajib berupa angka" })
    .int("Tahun lahir wali harus bilangan bulat")
    .min(1900, "Tahun lahir wali tidak valid")
    .max(2100, "Tahun lahir wali tidak valid")
    .optional(),
  guardianOccupation: z.string().optional(),
  guardianEducationLevel: z.string().optional(),
  guardianMonthlyIncome: z.string().optional(),

  heightCm: z.coerce
    .number({ error: "Tinggi badan wajib berupa angka" })
    .int("Tinggi badan harus bilangan bulat")
    .positive("Tinggi badan harus lebih dari 0"),
  weightKg: z.coerce
    .number({ error: "Berat badan wajib berupa angka" })
    .int("Berat badan harus bilangan bulat")
    .positive("Berat badan harus lebih dari 0"),
  distanceToSchoolKm: z.coerce
    .number({ error: "Jarak ke sekolah wajib berupa angka" })
    .int("Jarak ke sekolah harus bilangan bulat")
    .min(0, "Jarak ke sekolah tidak valid"),
  travelTimeMinutes: z.coerce
    .number({ error: "Waktu tempuh ke sekolah wajib berupa angka" })
    .int("Waktu tempuh ke sekolah harus bilangan bulat")
    .min(0, "Waktu tempuh ke sekolah tidak valid"),
  siblingCount: z.coerce
    .number({ error: "Jumlah saudara kandung wajib berupa angka" })
    .int("Jumlah saudara kandung harus bilangan bulat")
    .min(0, "Jumlah saudara kandung tidak valid"),
});

export const registrationAchievementSchema = z.object({
  type: z.string().min(1),
  level: z.string().min(1),
  name: z.string().min(1),
  year: z.string().min(1),
  organizer: z.string().min(1),
});

export const registrationNonformalEducationSchema = z.object({
  type: z.string().min(1),
  organizerOrSource: z.string().min(1),
  startYear: z.string().min(1),
  endYear: z.string().optional(),
});
