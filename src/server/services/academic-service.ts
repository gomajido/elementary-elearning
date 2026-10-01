import {
  AcademicYearRepository,
  SubjectRepository,
  ClassRepository,
  TeacherSubjectAssignmentRepository,
} from "@/server/repositories/academic-repository";
import { StudentRepository, EnrollmentRepository } from "@/server/repositories/student-repository";
import { getDb } from "@/lib/db";
import type { EnrollmentRecordStatus } from "@/lib/db/schema";

export class AcademicError extends Error {}

export type PromotionAction = "promote" | "repeat" | "withdraw";
export type PromotionOverride = { studentId: string; action: PromotionAction; toClassId?: string };

/**
 * Pure — decides what a single roster student's promotion should do, given
 * an optional override and the batch's default target class. A `"repeat"`
 * override with no `toClassId` is the one case that can't resolve to a plan;
 * everything else always has an outcome.
 */
export function resolvePromotionAction(
  studentId: string,
  overrideByStudentId: Map<string, PromotionOverride>,
  defaultToClassId: string
): { action: "withdraw" } | { action: "promote" | "repeat"; toClassId: string } | { error: string } {
  const override = overrideByStudentId.get(studentId);
  const action: PromotionAction = override?.action ?? "promote";

  if (action === "withdraw") return { action };
  if (action === "repeat" && !override?.toClassId) {
    return { error: "Kelas tujuan wajib diisi untuk siswa yang tinggal kelas" };
  }
  return { action, toClassId: override?.toClassId ?? defaultToClassId };
}

export const AcademicService = {
  listAcademicYears: () => AcademicYearRepository.list(),

  async createAcademicYear(input: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) {
    if (input.isCurrent) await AcademicYearRepository.unsetCurrent();
    return AcademicYearRepository.create(input);
  },

  async updateAcademicYear(id: string, input: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) {
    if (input.isCurrent) await AcademicYearRepository.unsetCurrent();
    return AcademicYearRepository.update(id, input);
  },

  deleteAcademicYear: (id: string) => AcademicYearRepository.softDelete(id),

  listSubjects: () => SubjectRepository.list(),

  createSubject: (input: { name: string; code?: string }) => SubjectRepository.create(input),

  updateSubject: (id: string, input: { name: string; code?: string }) => SubjectRepository.update(id, input),

  deleteSubject: (id: string) => SubjectRepository.softDelete(id),

  listClasses: () => ClassRepository.list(),

  listClassesWithDetails: () => ClassRepository.listWithDetails(),

  listAssignmentsWithDetails: () => TeacherSubjectAssignmentRepository.listAllWithDetails(),

  createClass: (input: {
    name: string;
    section?: string;
    gradeLevel: number;
    academicYearId: string;
    classTeacherId?: string;
    capacity?: number;
  }) => ClassRepository.create(input),

  updateClass: (
    id: string,
    input: {
      name: string;
      section?: string;
      gradeLevel: number;
      academicYearId: string;
      classTeacherId?: string;
      capacity?: number;
    },
  ) => ClassRepository.update(id, input),

  deleteClass: (id: string) => ClassRepository.softDelete(id),

  assignTeacherToClassSubject: (input: {
    teacherId: string;
    classId: string;
    subjectId: string;
    academicYearId: string;
  }) => TeacherSubjectAssignmentRepository.create(input),

  /**
   * Bulk-promotes a class roster into a new academic year, one atomic write
   * per student — a single student's failure (e.g. re-running an already
   * promoted batch, which trips the enrollments(studentId, academicYearId)
   * unique constraint) doesn't block the rest, same philosophy as
   * FeeService.generateInvoicesForClass.
   */
  async promoteClassBulk(input: {
    fromClassId: string;
    toAcademicYearId: string;
    defaultToClassId: string;
    enrolledAt: string;
    overrides?: PromotionOverride[];
  }) {
    const classRow = await ClassRepository.findById(input.fromClassId);
    if (!classRow) throw new AcademicError("Kelas asal tidak ditemukan");
    const fromAcademicYearId = classRow.academicYearId;

    const roster = await StudentRepository.listByClass(input.fromClassId);
    const overrideByStudentId = new Map((input.overrides ?? []).map((o) => [o.studentId, o]));

    const succeeded: { studentId: string; action: PromotionAction }[] = [];
    const failed: { studentId: string; error: string }[] = [];

    for (const student of roster) {
      const plan = resolvePromotionAction(student.id, overrideByStudentId, input.defaultToClassId);
      if ("error" in plan) {
        failed.push({ studentId: student.id, error: plan.error });
        continue;
      }

      try {
        const db = getDb();
        await db.transaction(async (tx) => {
          const oldEnrollment = await EnrollmentRepository.findByStudentAndYear(student.id, fromAcademicYearId, tx);

          if (plan.action === "withdraw") {
            if (oldEnrollment) await EnrollmentRepository.updateStatus(oldEnrollment.id, "withdrawn", tx);
            await StudentRepository.update(student.id, { currentClassId: null, enrollmentStatus: "withdrawn" }, tx);
            return;
          }

          const oldStatus: EnrollmentRecordStatus = plan.action === "repeat" ? "repeated" : "promoted";
          if (oldEnrollment) await EnrollmentRepository.updateStatus(oldEnrollment.id, oldStatus, tx);
          await EnrollmentRepository.create(
            {
              studentId: student.id,
              classId: plan.toClassId,
              academicYearId: input.toAcademicYearId,
              enrolledAt: input.enrolledAt,
            },
            tx
          );
          await StudentRepository.update(student.id, { currentClassId: plan.toClassId }, tx);
        });
        succeeded.push({ studentId: student.id, action: plan.action });
      } catch (err) {
        failed.push({ studentId: student.id, error: err instanceof Error ? err.message : "Gagal memproses siswa ini" });
      }
    }

    return { succeeded, failed };
  },
};
