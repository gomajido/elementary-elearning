import { getDb } from "@/lib/db";
import { hashPassword, generateTempPassword } from "@/lib/auth/password";
import { UserRepository } from "@/server/repositories/user-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";

export class TeacherRegistrationError extends Error {}

export const TeacherService = {
  listTeachers: () => TeacherRepository.list(),

  /**
   * Creates the login (role=teacher, temp password) and teacher record in
   * one atomic `db.batch()` — D1 has no multi-statement transactions, see
   * RFC 0001 "Key Risks / Gotchas". Returns the temp password once; there's
   * no email delivery in MVP, so the admin must share it out-of-band.
   */
  async registerTeacher(input: {
    email: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    phone?: string;
    hireDate?: string;
  }) {
    const existing = await UserRepository.findByEmail(input.email);
    if (existing) throw new TeacherRegistrationError("A user with this email already exists");

    const db = getDb();
    const userId = crypto.randomUUID();
    const teacherId = crypto.randomUUID();
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const [[user], [teacher]] = await db.batch([
      UserRepository.insertStatement({
        id: userId,
        email: input.email,
        passwordHash,
        role: "teacher",
        mustChangePassword: true,
      }),
      TeacherRepository.insertStatement({
        id: teacherId,
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        employeeNumber: input.employeeNumber,
        phone: input.phone,
        hireDate: input.hireDate,
      }),
    ]);

    return { user, teacher, tempPassword };
  },
};
