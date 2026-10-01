import { notFound } from "next/navigation";

import { AcademicService } from "@/server/services/academic-service";
import { ClassRepository } from "@/server/repositories/academic-repository";
import { StudentRepository } from "@/server/repositories/student-repository";
import { PromoteClassFlow } from "@/components/forms/promote-class-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PromoteClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;

  const [sourceClass, roster, classes, academicYears] = await Promise.all([
    ClassRepository.findById(classId),
    StudentRepository.listByClass(classId),
    AcademicService.listClasses(),
    AcademicService.listAcademicYears(),
  ]);

  if (!sourceClass) notFound();

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>
          Promosikan {sourceClass.name}
          {sourceClass.section ? ` ${sourceClass.section}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PromoteClassFlow sourceClass={sourceClass} roster={roster} classes={classes} academicYears={academicYears} />
      </CardContent>
    </Card>
  );
}
