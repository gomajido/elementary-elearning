"use client";

import { useActionState, useState } from "react";

import { generateInvoiceAction, type ActionState } from "@/server/controllers/fee-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: ActionState = {};

export function InvoiceGenerateForm({
  students,
  classes,
  academicYears,
  feeStructures,
}: {
  students: { id: string; firstName: string; lastName: string; admissionNumber: string }[];
  classes: { id: string; name: string; section: string | null }[];
  academicYears: { id: string; name: string }[];
  feeStructures: { id: string; name: string; amountCents: number }[];
}) {
  const [state, formAction, pending] = useActionState(generateInvoiceAction, initialState);
  const [target, setTarget] = useState<"student" | "class">("student");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="target"
            value="student"
            checked={target === "student"}
            onChange={() => setTarget("student")}
          />
          Single student
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="target"
            value="class"
            checked={target === "class"}
            onChange={() => setTarget("class")}
          />
          Whole class
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {target === "student" ? (
          <div className="flex flex-col gap-2">
            <Label>Student</Label>
            <Select
              name="studentId"
              required
              items={Object.fromEntries(
                students.map((s) => [s.id, `${s.firstName} ${s.lastName} (${s.admissionNumber})`])
              )}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
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
        )}

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

        <div className="flex flex-col gap-2">
          <Label htmlFor="issueDate">Issue date</Label>
          <Input id="issueDate" name="issueDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" required />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Fees to include</p>
        <div className="flex flex-col gap-2">
          {feeStructures.map((fee) => (
            <label key={fee.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="feeStructureIds" value={fee.id} />
              {fee.name} — ${(fee.amountCents / 100).toFixed(2)}
            </label>
          ))}
          {feeStructures.length === 0 && (
            <p className="text-sm text-muted-foreground">No fee structures yet — add one first.</p>
          )}
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Generating…" : "Generate invoice"}
      </Button>
    </form>
  );
}
