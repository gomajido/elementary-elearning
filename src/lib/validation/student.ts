import { z } from "zod";

import { GENDERS } from "@/lib/db/schema";

export const relationshipTypeSchema = z.enum(["mother", "father", "guardian", "other"]);

export const studentSchema = z.object({
  admissionNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(GENDERS),
  classId: z.string().min(1),
  academicYearId: z.string().min(1),
  enrollmentDate: z.string().min(1),
  guardian1FirstName: z.string().min(1),
  guardian1LastName: z.string().min(1),
  guardian1Relationship: relationshipTypeSchema,
  guardian1Phone: z.string().optional(),
  guardian1Email: z.string().email().optional().or(z.literal("")),
  guardian2FirstName: z.string().optional(),
  guardian2LastName: z.string().optional(),
  guardian2Relationship: relationshipTypeSchema.optional(),
  guardian2Phone: z.string().optional(),
  guardian2Email: z.string().email().optional().or(z.literal("")),
});
