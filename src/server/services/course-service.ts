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

  /** Resolves a Bab and checks the caller owns its course. */
  async assertTeacherOwnsTheme(teacherUserId: string, themeId: string) {
    const theme = await ThemeRepository.findById(themeId);
    if (!theme) throw new CourseError("Bab tidak ditemukan");
    await CourseService.assertTeacherOwnsCourse(teacherUserId, theme.courseId);
    return theme;
  },

  async renameTheme(input: { teacherUserId: string; themeId: string; title: string }) {
    const theme = await CourseService.assertTeacherOwnsTheme(input.teacherUserId, input.themeId);
    await ThemeRepository.updateTitle(theme.id, input.title);
    return theme;
  },

  /**
   * Refuses while the Bab still holds anything — deleting it would orphan
   * materi/tugas/kuis (and the student work hanging off them) behind a
   * hidden parent, so the teacher is told what to clear out first.
   */
  async deleteTheme(input: { teacherUserId: string; themeId: string }) {
    const theme = await CourseService.assertTeacherOwnsTheme(input.teacherUserId, input.themeId);
    const children = await ThemeRepository.countChildren(theme.id);
    const blocking = [
      children.contentItems && `${children.contentItems} materi`,
      children.assignments && `${children.assignments} tugas`,
      children.quizzes && `${children.quizzes} kuis`,
    ].filter(Boolean) as string[];
    if (blocking.length > 0) {
      throw new CourseError(`Bab ini masih berisi ${blocking.join(", ")}. Hapus isinya dulu.`);
    }
    await ThemeRepository.softDelete(theme.id);
    return theme;
  },

  /** Moves a Bab one slot up or down by swapping orderIndex with its neighbour. */
  async moveTheme(input: { teacherUserId: string; themeId: string; direction: "up" | "down" }) {
    const theme = await CourseService.assertTeacherOwnsTheme(input.teacherUserId, input.themeId);
    const siblings = await ThemeRepository.listByCourse(theme.courseId);
    const i = siblings.findIndex((t) => t.id === theme.id);
    const j = input.direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= siblings.length) return theme; // already at the end, nothing to do
    await ThemeRepository.swapOrder(siblings[i], siblings[j]);
    return theme;
  },

  async updateContentItem(input: {
    teacherUserId: string;
    contentItemId: string;
    title: string;
    bodyMarkdown?: string;
    externalUrl?: string;
  }) {
    const item = await CourseRepository.findContentItemById(input.contentItemId);
    if (!item) throw new CourseError("Materi tidak ditemukan");
    await CourseService.assertTeacherOwnsCourse(input.teacherUserId, item.courseId);
    await CourseRepository.updateContentItem(item.id, {
      title: input.title,
      bodyMarkdown: input.bodyMarkdown ?? null,
      externalUrl: input.externalUrl ?? null,
    });
    return item;
  },

  async deleteContentItem(input: { teacherUserId: string; contentItemId: string }) {
    const item = await CourseRepository.findContentItemById(input.contentItemId);
    if (!item) throw new CourseError("Materi tidak ditemukan");
    await CourseService.assertTeacherOwnsCourse(input.teacherUserId, item.courseId);
    await CourseRepository.softDeleteContentItem(item.id);
    return item;
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
