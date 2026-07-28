import { getDb } from "@/lib/db";
import {
  StudentRepository,
  GuardianRepository,
  EnrollmentRepository,
} from "@/server/repositories/student-repository";
import type { BatchItem } from "drizzle-orm/batch";

type NonEmptyBatch = [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]];

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
   * current-year enrollment record — all in one atomic `db.batch()` (see
   * RFC 0001 "Key Risks / Gotchas"). No user/login account is created here;
   * guardian portal accounts land in Phase 2 with the parent portal.
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

    const statements: BatchItem<"sqlite">[] = [
      StudentRepository.insertStatement({
        id: studentId,
        admissionNumber: input.admissionNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        currentClassId: input.classId,
        enrollmentDate: input.enrollmentDate,
      }),
      EnrollmentRepository.insertStatement({
        studentId,
        classId: input.classId,
        academicYearId: input.academicYearId,
        enrolledAt: input.enrollmentDate,
      }),
    ];

    for (const guardian of input.guardians) {
      const guardianId = crypto.randomUUID();
      statements.push(
        GuardianRepository.insertStatement({ id: guardianId, ...guardian }),
        GuardianRepository.linkInsertStatement({
          studentId,
          guardianId,
          isPrimaryContact: guardian.isPrimaryContact,
          isBillingContact: guardian.isBillingContact,
        })
      );
    }

    await db.batch(statements as unknown as NonEmptyBatch);
    return StudentRepository.findById(studentId);
  },
};
