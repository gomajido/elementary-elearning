import { getDb } from "@/lib/db";
import {
  StudentRepository,
  GuardianRepository,
  EnrollmentRepository,
} from "@/server/repositories/student-repository";
import { UserRepository } from "@/server/repositories/user-repository";
import { hashPassword, generateTempPassword } from "@/lib/auth/password";

export class StudentPortalError extends Error {}

export type GuardianInput = {
  firstName: string;
  lastName: string;
  relationshipType: "mother" | "father" | "guardian" | "other";
  phone?: string;
  email?: string;
  address?: string;
  isPrimaryContact?: boolean;
  isBillingContact?: boolean;
};

export const StudentService = {
  listStudents: () => StudentRepository.list(),
  listStudentsWithDetails: () => StudentRepository.listWithDetails(),
  listGuardiansForStudent: (studentId: string) => StudentRepository.listGuardiansForStudent(studentId),

  /**
   * Registers a student, links one or more guardians, and creates the
   * current-year enrollment record — all in one atomic transaction. No
   * user/login account is created here; guardian portal accounts are
   * granted separately (see GuardianService.grantPortalAccess).
   */
  async registerStudent(input: {
    admissionNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    classId: string;
    academicYearId: string;
    enrollmentDate: string;
    guardians: GuardianInput[];
  }) {
    const db = getDb();
    const studentId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await StudentRepository.create(
        {
          id: studentId,
          admissionNumber: input.admissionNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          currentClassId: input.classId,
          enrollmentDate: input.enrollmentDate,
        },
        tx
      );
      await EnrollmentRepository.create(
        {
          studentId,
          classId: input.classId,
          academicYearId: input.academicYearId,
          enrolledAt: input.enrollmentDate,
        },
        tx
      );

      for (const guardian of input.guardians) {
        const guardianId = crypto.randomUUID();
        await GuardianRepository.create({ id: guardianId, ...guardian }, tx);
        await GuardianRepository.linkToStudent(
          {
            studentId,
            guardianId,
            isPrimaryContact: guardian.isPrimaryContact,
            isBillingContact: guardian.isBillingContact,
          },
          tx
        );
      }
    });

    return StudentRepository.findById(studentId);
  },

  /**
   * Grants portal access to an existing student record (older grades may
   * want a login — see RFC 0001 "Roles & accounts": `students.userId` is
   * nullable since young kids don't necessarily need one). Same atomic
   * user-insert + link-update pattern as guardian/teacher provisioning.
   */
  async grantPortalAccess(studentId: string, email: string) {
    const student = await StudentRepository.findById(studentId);
    if (!student) throw new StudentPortalError("Student not found");
    if (student.userId) throw new StudentPortalError("This student already has portal access");

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) throw new StudentPortalError("A user with this email already exists");

    const db = getDb();
    const userId = crypto.randomUUID();
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    await db.transaction(async (tx) => {
      await UserRepository.create({ id: userId, email, passwordHash, role: "student", mustChangePassword: true }, tx);
      await StudentRepository.linkUser(studentId, userId, tx);
    });

    return { tempPassword };
  },
};
