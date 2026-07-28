import { AssignmentRepository, AssignmentSubmissionRepository } from "@/server/repositories/assignment-repository";
import { CourseRepository } from "@/server/repositories/course-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";

export class AssignmentError extends Error {}

export const AssignmentService = {
  listForCourse: (courseId: string) => AssignmentRepository.listByCourse(courseId),

  async createAssignment(input: {
    teacherUserId: string;
    courseId: string;
    title: string;
    instructions?: string;
    dueDate: string;
    maxScore: number;
    allowLateSubmission?: boolean;
  }) {
    const teacher = await TeacherRepository.findByUserId(input.teacherUserId);
    const course = await CourseRepository.findById(input.courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new AssignmentError("You do not own this course");

    return AssignmentRepository.create({
      courseId: input.courseId,
      title: input.title,
      instructions: input.instructions,
      dueDate: input.dueDate,
      maxScore: input.maxScore,
      allowLateSubmission: input.allowLateSubmission,
    });
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
    if (!assignment) throw new AssignmentError("Assignment not found");

    const today = new Date().toISOString().slice(0, 10);
    const isLate = today > assignment.dueDate;
    if (isLate && !assignment.allowLateSubmission) {
      throw new AssignmentError("This assignment no longer accepts submissions");
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
    if (!teacher) throw new AssignmentError("No teacher record for this account");
    const submission = await AssignmentSubmissionRepository.findById(input.submissionId);
    if (!submission) throw new AssignmentError("Submission not found");
    const assignment = await AssignmentRepository.findById(submission.assignmentId);
    const course = assignment ? await CourseRepository.findById(assignment.courseId) : null;
    if (!course || course.teacherId !== teacher.id) throw new AssignmentError("You do not own this assignment");
    if (input.score > assignment!.maxScore) throw new AssignmentError(`Score cannot exceed ${assignment!.maxScore}`);

    await AssignmentSubmissionRepository.grade(input.submissionId, {
      score: input.score,
      feedback: input.feedback,
      gradedByTeacherId: teacher.id,
    });

    return { assignmentId: submission.assignmentId };
  },
};
