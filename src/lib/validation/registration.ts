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
  nisn: z.string().min(1),
  nis: z.string().optional(),
  certificateSerialNumber: z.string().optional(),
  skhunSerialNumber: z.string().optional(),
  nationalExamNumber: z.string().optional(),
  nik: z.string().min(16).max(16),
  previousSchoolNpsn: z.string().optional(),
  previousSchoolName: z.string().optional(),
  placeOfBirth: z.string().min(1),
  dateOfBirth: z.string().min(1),
  religion: z.string().min(1),
  specialNeeds: z.string().min(1),

  addressDetail: z.string().min(1),
  dusun: z.string().optional(),
  rt: z.string().min(1),
  rw: z.string().min(1),
  kelurahan: z.string().min(1),
  postalCode: z.string().optional(),
  kecamatan: z.string().min(1),
  kabupaten: z.string().min(1),
  provinsi: z.string().min(1),
  transportMode: z.string().min(1),
  livingArrangement: z.string().min(1),
  homePhone: z.string().optional(),
  mobilePhone: z.string().optional(),
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
  fatherBirthYear: z.coerce.number().int().min(1900).max(2100),
  fatherSpecialNeeds: z.string().min(1),
  fatherOccupation: z.string().min(1),
  fatherEducationLevel: z.string().min(1),
  fatherMonthlyIncome: z.string().min(1),

  motherName: z.string().min(1),
  motherBirthYear: z.coerce.number().int().min(1900).max(2100),
  motherSpecialNeeds: z.string().min(1),
  motherOccupation: z.string().min(1),
  motherEducationLevel: z.string().min(1),
  motherMonthlyIncome: z.string().min(1),

  // DATA WALI — the only section not marked mandatory on the real form.
  guardianName: z.string().optional(),
  guardianBirthYear: z.coerce.number().int().min(1900).max(2100).optional(),
  guardianOccupation: z.string().optional(),
  guardianEducationLevel: z.string().optional(),
  guardianMonthlyIncome: z.string().optional(),

  heightCm: z.coerce.number().int().positive(),
  weightKg: z.coerce.number().int().positive(),
  distanceToSchoolKm: z.coerce.number().int().min(0),
  travelTimeMinutes: z.coerce.number().int().min(0),
  siblingCount: z.coerce.number().int().min(0),
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
