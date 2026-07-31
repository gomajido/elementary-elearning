import { z } from "zod";

export const teacherSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeNumber: z.string().min(1),
  phone: z.string().optional(),
  hireDate: z.string().optional(),
});
