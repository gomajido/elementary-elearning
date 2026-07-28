import { AttendanceRepository, type AttendanceUpsert } from "@/server/repositories/attendance-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";
import { ClassRepository } from "@/server/repositories/academic-repository";

export class AttendanceError extends Error {}

export const AttendanceService = {
  rosterForClassAndDate: (classId: string, date: string) => AttendanceRepository.rosterForClassAndDate(classId, date),

  historyForStudent: (studentId: string) => AttendanceRepository.listForStudent(studentId),

  /** Homeroom classes for the teacher account making the request. */
  async classesForTeacherUser(userId: string) {
    const teacher = await TeacherRepository.findByUserId(userId);
    if (!teacher) return { teacher: null, classes: [] };
    const classes = await ClassRepository.listByClassTeacher(teacher.id);
    return { teacher, classes };
  },

  /**
   * Saves a whole day's register for a class in one atomic upsert (see
   * `AttendanceRepository.saveRegister`). Only the class's own homeroom
   * teacher may record its attendance.
   */
  async saveRegister(
    teacherUserId: string,
    classId: string,
    date: string,
    entries: { studentId: string; status: AttendanceUpsert["status"]; notes?: string }[]
  ) {
    const teacher = await TeacherRepository.findByUserId(teacherUserId);
    if (!teacher) throw new AttendanceError("Tidak ada data guru untuk akun ini");

    const classRow = await ClassRepository.findById(classId);
    if (!classRow || classRow.classTeacherId !== teacher.id) {
      throw new AttendanceError("Anda bukan wali kelas untuk kelas ini");
    }

    await AttendanceRepository.saveRegister(
      entries.map((entry) => ({
        studentId: entry.studentId,
        classId,
        date,
        status: entry.status,
        notes: entry.notes,
        recordedByTeacherId: teacher.id,
      }))
    );
  },
};
