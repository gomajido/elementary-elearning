import { getDb } from "@/lib/db";
import { hashPassword, generateTempPassword } from "@/lib/auth/password";
import { UserRepository } from "@/server/repositories/user-repository";
import { TeacherRepository, type TeacherUpdate } from "@/server/repositories/teacher-repository";

export class TeacherRegistrationError extends Error {}

export const TeacherService = {
  listTeachers: () => TeacherRepository.list(),
  deleteTeacher: (id: string) => TeacherRepository.softDelete(id),

  /**
   * NIP doubles as the teacher's login username (see registerTeacher) —
   * editing it must keep the linked user's username in sync, otherwise the
   * old NIP silently keeps working (or worse, drifts) after a correction.
   */
  async updateTeacher(id: string, input: TeacherUpdate) {
    const teacher = await TeacherRepository.update(id, input);
    if (input.employeeNumber) {
      await UserRepository.updateUsername(teacher.userId, input.employeeNumber);
    }
    return teacher;
  },

  /**
   * Creates the login (role=teacher, temp password) and teacher record in
   * one atomic transaction. Returns the temp password once; there's no
   * email delivery in MVP, so the admin must share it out-of-band.
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
    if (existing) throw new TeacherRegistrationError("Pengguna dengan email ini sudah ada");

    const db = getDb();
    const userId = crypto.randomUUID();
    const teacherId = crypto.randomUUID();
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const { user, teacher } = await db.transaction(async (tx) => {
      const user = await UserRepository.create(
        {
          id: userId,
          email: input.email,
          // NIP doubles as login username so teachers can sign in with
          // either — see RFC-less design note in auth-service.ts login().
          username: input.employeeNumber,
          passwordHash,
          roles: ["teacher"],
          mustChangePassword: true,
        },
        tx
      );
      const teacher = await TeacherRepository.create(
        {
          id: teacherId,
          userId,
          firstName: input.firstName,
          lastName: input.lastName,
          employeeNumber: input.employeeNumber,
          phone: input.phone,
          hireDate: input.hireDate,
        },
        tx
      );
      return { user, teacher };
    });

    return { user, teacher, tempPassword };
  },
};
