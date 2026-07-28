import { CourseRepository } from "@/server/repositories/course-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";
import { StudentRepository } from "@/server/repositories/student-repository";
import type { ContentItemType } from "@/lib/db/schema";

export class CourseError extends Error {}

export const CourseService = {
  async coursesForTeacherUser(userId: string) {
    const teacher = await TeacherRepository.findByUserId(userId);
    if (!teacher) return { teacher: null, courses: [] };
    const courses = await CourseRepository.listByTeacher(teacher.id);
    return { teacher, courses };
  },

  /** Courses in the logged-in student's own class — the RBAC boundary for the student portal. */
  async coursesForStudentUser(studentId: string) {
    const student = await StudentRepository.findById(studentId);
    if (!student?.currentClassId) return [];
    return CourseRepository.listPublishedForClass(student.currentClassId);
  },

  async createCourse(input: {
    teacherUserId: string;
    title: string;
    description?: string;
    subjectId: string;
    classId?: string;
    academicYearId: string;
  }) {
    const teacher = await TeacherRepository.findByUserId(input.teacherUserId);
    if (!teacher) throw new CourseError("No teacher record for this account");
    return CourseRepository.create({
      title: input.title,
      description: input.description,
      subjectId: input.subjectId,
      classId: input.classId,
      teacherId: teacher.id,
      academicYearId: input.academicYearId,
    });
  },

  async courseDetail(courseId: string) {
    const course = await CourseRepository.findById(courseId);
    if (!course) return null;
    const contentItems = await CourseRepository.listContentItems(courseId);
    return { course, contentItems };
  },

  async addContentItem(input: {
    teacherUserId: string;
    courseId: string;
    title: string;
    type: ContentItemType;
    r2Key?: string;
    bodyMarkdown?: string;
    externalUrl?: string;
  }) {
    const teacher = await TeacherRepository.findByUserId(input.teacherUserId);
    if (!teacher) throw new CourseError("No teacher record for this account");
    const course = await CourseRepository.findById(input.courseId);
    if (!course || course.teacherId !== teacher.id) throw new CourseError("You do not own this course");

    return CourseRepository.createContentItem({
      courseId: input.courseId,
      title: input.title,
      type: input.type,
      r2Key: input.r2Key,
      bodyMarkdown: input.bodyMarkdown,
      externalUrl: input.externalUrl,
    });
  },

  /** Verifies the logged-in student may view this course — same class, and published. */
  async assertStudentCanViewCourse(studentId: string, courseId: string) {
    const student = await StudentRepository.findById(studentId);
    const course = await CourseRepository.findById(courseId);
    if (!student || !course || course.classId !== student.currentClassId || !course.isPublished) {
      throw new CourseError("Not authorized to view this course");
    }
  },

  async publishCourse(teacherUserId: string, courseId: string) {
    const teacher = await TeacherRepository.findByUserId(teacherUserId);
    const course = await CourseRepository.findById(courseId);
    if (!teacher || !course || course.teacherId !== teacher.id) throw new CourseError("You do not own this course");
    await CourseRepository.publish(courseId);
  },
};
