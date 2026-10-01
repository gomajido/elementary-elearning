import { z } from "zod";

import { MARITAL_STATUSES, EMPLOYMENT_STATUSES, SALARY_SOURCES } from "@/lib/db/schema";

/** An unselected <select> submits "" — treat that as "not provided", not a literal enum value. */
function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((v) => (v === "" ? undefined : v), z.enum(values).optional());
}

export const teacherSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeNumber: z.string().min(1),
  phone: z.string().optional(),
  hireDate: z.string().optional(),
});

// Dapodik F-PTK profile — all optional, filled in progressively (unlike
// TSD-01's registration form, there's no "submit once, all mandatory" step
// here). See TSD-02 for the verified field list and scope.
export const teacherDapodikProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  motherName: z.string().optional(),
  addressDetail: z.string().optional(),
  dusun: z.string().optional(),
  rt: z.string().optional(),
  rw: z.string().optional(),
  kelurahan: z.string().optional(),
  postalCode: z.string().optional(),
  kecamatan: z.string().optional(),
  kabupaten: z.string().optional(),
  provinsi: z.string().optional(),
  nik: z.string().length(16).optional().or(z.literal("")),
  npwp: z.string().optional(),
  taxpayerName: z.string().optional(),
  maritalStatus: optionalEnum(MARITAL_STATUSES),
  spouseName: z.string().optional(),
  spouseOccupation: z.string().optional(),

  employmentStatus: optionalEnum(EMPLOYMENT_STATUSES),
  niyNigk: z.string().optional(),
  nigb: z.string().optional(),
  nip: z.string().optional(),
  nuptk: z.string().optional(),
  ptkType: z.string().optional(),
  isActive: z.boolean().optional(),
  appointmentDecreeNumber: z.string().optional(),
  appointmentEffectiveDate: z.string().optional(),
  appointmentDecreeIssuer: z.string().optional(),
  cpnsDecreeNumber: z.string().optional(),
  cpnsEffectiveDate: z.string().optional(),
  pnsEffectiveDate: z.string().optional(),
  rankGrade: z.string().optional(),
  salarySource: optionalEnum(SALARY_SOURCES),

  assignmentLetterNumber: z.string().optional(),
  assignmentLetterDate: z.string().optional(),
  assignmentEffectiveDate: z.string().optional(),
  isHomeSchool: z.boolean().optional(),

  isPrincipalLicensed: z.boolean().optional(),
  vocationalProgramCode: z.string().optional(),
  specialNeedsTypesHandled: z.string().optional(),
  specialNeedsSpecialization: z.string().optional(),
  specialNeedsSkills: z.string().optional(),
});
