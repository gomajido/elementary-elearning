import { CourseRepository } from "@/server/repositories/course-repository";
import { TeacherRepository } from "@/server/repositories/teacher-repository";
import { StudentRepository } from "@/server/repositories/student-repository";
import { ThemeRepository } from "@/server/repositories/theme-repository";
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
    if (!teacher) throw new CourseError("Tidak ada data guru untuk akun ini");
    const course = await CourseRepository.create({
      title: input.title,
      description: input.description,
      subjectId: input.subjectId,
      classId: input.classId,
      teacherId: teacher.id,
      academicYearId: input.academicYearId,
    });
    // Materi/Tugas/Kuis can only be added inside a Bab, so a course with none
    // is a dead end — every course starts with one, same as the backfill did
    // for pre-existing courses.
    await ThemeRepository.create({ courseId: course.id, title: "Bab 1", orderIndex: 0 });
    return course;
  },

  async courseDetail(courseId: string) {
    const course = await CourseRepository.findById(courseId);
    if (!course) return null;
    const contentItems = await CourseRepository.listContentItems(courseId);
    const themes = await ThemeRepository.listByCourse(courseId);
    return { course, contentItems, themes };
  },

  /** Throws unless the given user is a teacher who owns this course. */
  async assertTeacherOwnsCourse(teacherUserId: string, courseId: string) {
    const teacher = await TeacherRepository.findByUserId(teacherUserId);
    if (!teacher) throw new CourseError("Tidak ada data guru untuk akun ini");
    const course = await CourseRepository.findById(courseId);
    if (!course || course.teacherId !== teacher.id) throw new CourseError("Anda bukan pemilik kursus ini");
    return { teacher, course };
  },

  async createTheme(input: { teacherUserId: string; courseId: string; title: string }) {
    await CourseService.assertTeacherOwnsCourse(input.teacherUserId, input.courseId);
    const existing = await ThemeRepository.listByCourse(input.courseId);
    return ThemeRepository.create({ courseId: input.courseId, title: input.title, orderIndex: existing.length });
  },

  async addContentItem(input: {
    teacherUserId: string;
    courseId: string;
    themeId: string;
    title: string;
    type: ContentItemType;
    r2Key?: string;
    bodyMarkdown?: string;
    externalUrl?: string;
  }) {
    await CourseService.assertTeacherOwnsCourse(input.teacherUserId, input.courseId);

    return CourseRepository.createContentItem({
      courseId: input.courseId,
      themeId: input.themeId,
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
      throw new CourseError("Tidak berwenang melihat kursus ini");
    }
  },

  async publishCourse(teacherUserId: string, courseId: string) {
    await CourseService.assertTeacherOwnsCourse(teacherUserId, courseId);
    await CourseRepository.publish(courseId);
  },
};
