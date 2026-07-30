import { AcademicService } from "@/server/services/academic-service";
import { TeacherService } from "@/server/services/teacher-service";
import { TeacherAssignmentForm } from "@/components/forms/teacher-assignment-form";
import { ActionDialog } from "@/components/dashboard/action-dialog";
import { ClassAssignmentsTable } from "@/components/tables/class-assignments-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function TeacherAssignmentsPage() {
  const [assignmentRows, teachers, classes, subjects, academicYears] = await Promise.all([
    AcademicService.listAssignmentsWithDetails(),
    TeacherService.listTeachers(),
    AcademicService.listClasses(),
    AcademicService.listSubjects(),
    AcademicService.listAcademicYears(),
  ]);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Penugasan</h1>
        <ActionDialog triggerLabel="Penugasan Baru" title="Tetapkan guru ke kelas/mata pelajaran">
          <TeacherAssignmentForm
            teachers={teachers}
            classes={classes}
            subjects={subjects}
            academicYears={academicYears}
          />
        </ActionDialog>
      </div>

      <Card>
        <CardContent>
          <ClassAssignmentsTable rows={assignmentRows} />
        </CardContent>
      </Card>
    </div>
  );
}
