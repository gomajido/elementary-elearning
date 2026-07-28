"use client";

import { useActionState, useState } from "react";

import { createStudentAction, type CreateStudentState } from "@/server/controllers/student-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: CreateStudentState = {};

const RELATIONSHIPS = ["mother", "father", "guardian", "other"] as const;

export function StudentForm({
  classes,
  academicYears,
}: {
  classes: { id: string; name: string; section: string | null }[];
  academicYears: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createStudentAction, initialState);
  const [showSecondGuardian, setShowSecondGuardian] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="admissionNumber">Admission number</Label>
          <Input id="admissionNumber" name="admissionNumber" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gender">Gender (optional)</Label>
          <Input id="gender" name="gender" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="enrollmentDate">Enrollment date</Label>
          <Input id="enrollmentDate" name="enrollmentDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Class</Label>
          <Select
            name="classId"
            required
            items={Object.fromEntries(classes.map((c) => [c.id, `${c.name}${c.section ? ` ${c.section}` : ""}`]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.section ? ` ${c.section}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Academic year</Label>
          <Select
            name="academicYearId"
            required
            items={Object.fromEntries(academicYears.map((y) => [y.id, y.name]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-3 text-sm font-medium">Primary guardian</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="guardian1FirstName">First name</Label>
            <Input id="guardian1FirstName" name="guardian1FirstName" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guardian1LastName">Last name</Label>
            <Input id="guardian1LastName" name="guardian1LastName" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Relationship</Label>
            <Select name="guardian1Relationship" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guardian1Phone">Phone (optional)</Label>
            <Input id="guardian1Phone" name="guardian1Phone" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guardian1Email">Email (optional)</Label>
            <Input id="guardian1Email" name="guardian1Email" type="email" />
          </div>
        </div>
      </div>

      {showSecondGuardian ? (
        <div>
          <p className="mb-3 text-sm font-medium">Second guardian</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardian2FirstName">First name</Label>
              <Input id="guardian2FirstName" name="guardian2FirstName" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardian2LastName">Last name</Label>
              <Input id="guardian2LastName" name="guardian2LastName" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Relationship</Label>
              <Select name="guardian2Relationship">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardian2Phone">Phone (optional)</Label>
              <Input id="guardian2Phone" name="guardian2Phone" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guardian2Email">Email (optional)</Label>
              <Input id="guardian2Email" name="guardian2Email" type="email" />
            </div>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setShowSecondGuardian(true)}>
          + Add second guardian
        </Button>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Registering…" : "Register student"}
      </Button>
    </form>
  );
}
