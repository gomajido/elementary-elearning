import { AssignmentRepository, AssignmentSubmissionRepository } from "@/server/repositories/assignment-repository";
import { CourseRepository } from "@/server/repositories/course-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";

export class AssignmentError extends Error {}

export const AssignmentService = {
  listForCourse: (courseId: string) => AssignmentRepository.listByCourse(courseId),

  async createAssignment(input: {
    teacherUserId: string;
    courseId: string;
    themeId: string;
    title: string;
    instructions?: string;
    dueDate: string;
    maxScore: number;
    allowLateSubmission?: boolean;
    attachmentR2Key?: string;
  }) {
    const teacher = await TeacherRepository.findByUserId(input.teacherUserId);
    const course = await CourseRepository.findById(input.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new AssignmentError("Anda bukan pemilik kursus ini");

    return AssignmentRepository.create({
      courseId: input.courseId,
      themeId: input.themeId,
      title: input.title,
      instructions: input.instructions,
      dueDate: input.dueDate,
      maxScore: input.maxScore,
      allowLateSubmission: input.allowLateSubmission,
      attachmentR2Key: input.attachmentR2Key,
    });
  },

  /** Resolves an assignment and checks the caller owns its course. */
  async assertTeacherOwnsAssignment(teacherUserId: string, assignmentId: string) {
    const assignment = await AssignmentRepository.findById(assignmentId);
    if (!assignment) throw new AssignmentError("Tugas tidak ditemukan");
    const teacher = await TeacherRepository.findByUserId(teacherUserId);
    const course = await CourseRepository.findById(assignment.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) {
      throw new AssignmentError("Anda bukan pemilik tugas ini");
    }
    return assignment;
  },

  async updateAssignment(input: {
    teacherUserId: string;
    assignmentId: string;
    title: string;
    instructions?: string;
    dueDate: string;
    maxScore: number;
    allowLateSubmission?: boolean;
  }) {
    const assignment = await AssignmentService.assertTeacherOwnsAssignment(input.teacherUserId, input.assignmentId);
    await AssignmentRepository.update(assignment.id, {
      title: input.title,
      instructions: input.instructions,
      dueDate: input.dueDate,
      maxScore: input.maxScore,
      allowLateSubmission: input.allowLateSubmission,
    });
    return assignment;
  },

  /** Refuses once anyone has turned work in — those submissions and grades are the record. */
  async deleteAssignment(input: { teacherUserId: string; assignmentId: string }) {
    const assignment = await AssignmentService.assertTeacherOwnsAssignment(input.teacherUserId, input.assignmentId);
    const submissions = await AssignmentRepository.countSubmissions(assignment.id);
    if (submissions > 0) {
      throw new AssignmentError(
        `Tugas ini sudah dikumpulkan ${submissions} siswa, jadi tidak bisa dihapus. Nilai mereka akan hilang.`,
      );
    }
    await AssignmentRepository.softDelete(assignment.id);
    return assignment;
  },

  async assignmentDetail(assignmentId: string) {
    const assignment = await AssignmentRepository.findById(assignmentId);
    if (!assignment) return null;
    const course = await CourseRepository.findById(assignment.courseId);
    return { assignment, course };
  },

  async submissionsForAssignment(assignmentId: string) {
    return AssignmentSubmissionRepository.listForAssignment(assignmentId);
  },

  async submissionForStudent(assignmentId: string, studentId: string) {
    return AssignmentSubmissionRepository.findForStudent(assignmentId, studentId);
  },

  async submit(input: { assignmentId: string; studentId: string; textResponse?: string; attachmentR2Key?: string }) {
    const assignment = await AssignmentRepository.findById(input.assignmentId);
    if (!assignment) throw new AssignmentError("Tugas tidak ditemukan");

    const today = new Date().toISOString().slice(0, 10);
    const isLate = today > assignment.dueDate;
    if (isLate && !assignment.allowLateSubmission) {
      throw new AssignmentError("Tugas ini sudah tidak menerima pengumpulan");
    }

    return AssignmentSubmissionRepository.upsertSubmission({
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      textResponse: input.textResponse,
      attachmentR2Key: input.attachmentR2Key,
      status: isLate ? "late" : "submitted",
    });
  },

  async gradeSubmission(input: {
    teacherUserId: string;
    submissionId: string;
    score: number;
    feedback?: string;
  }) {
    const teacher = await TeacherRepository.findByUserId(input.teacherUserId);
    if (!teacher) throw new AssignmentError("Tidak ada data guru untuk akun ini");
    const submission = await AssignmentSubmissionRepository.findById(input.submissionId);
    if (!submission) throw new AssignmentError("Pengumpulan tidak ditemukan");
    const assignment = await AssignmentRepository.findById(submission.assignmentId);
    const course = assignment ? await CourseRepository.findById(assignment.courseId) : null;
    if (!course || course.teacherId !== teacher.id) throw new AssignmentError("Anda bukan pemilik tugas ini");
    if (input.score > assignment!.maxScore) throw new AssignmentError(`Nilai tidak boleh melebihi ${assignment!.maxScore}`);

    await AssignmentSubmissionRepository.grade(input.submissionId, {
      score: input.score,
      feedback: input.feedback,
      gradedByTeacherId: teacher.id,
    });

    return { assignmentId: submission.assignmentId };
  },
};
