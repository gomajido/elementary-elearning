import {
  AcademicYearRepository,
  SubjectRepository,
  ClassRepository,
  TeacherSubjectAssignmentRepository,
} from "@/server/repositories/academic-repository";

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
};
