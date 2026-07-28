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

  listSubjects: () => SubjectRepository.list(),

  createSubject: (input: { name: string; code?: string }) => SubjectRepository.create(input),

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

  assignTeacherToClassSubject: (input: {
    teacherId: string;
    classId: string;
    subjectId: string;
    academicYearId: string;
  }) => TeacherSubjectAssignmentRepository.create(input),
};
