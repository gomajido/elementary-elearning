"use client";

import { useActionState } from "react";

import { saveRegisterAction, type SaveRegisterState } from "@/server/controllers/attendance-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/db/schema";

const initialState: SaveRegisterState = {};

type RosterRow = {
  student: { id: string; firstName: string; lastName: string };
  record: { status: AttendanceStatus; notes: string | null } | null;
};

export function AttendanceRegisterForm({
  classId,
  date,
  roster,
}: {
  classId: string;
  date: string;
  roster: RosterRow[];
}) {
  const [state, formAction, pending] = useActionState(saveRegisterAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="date" value={date} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.map(({ student, record }) => (
            <TableRow key={student.id}>
              <TableCell>
                {student.firstName} {student.lastName}
                <input type="hidden" name="studentId" value={student.id} />
              </TableCell>
              <TableCell>
                <select
                  name={`status_${student.id}`}
                  defaultValue={record?.status ?? "present"}
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  {ATTENDANCE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </TableCell>
              <TableCell>
                <Input name={`notes_${student.id}`} defaultValue={record?.notes ?? ""} className="h-8" />
              </TableCell>
            </TableRow>
          ))}
          {roster.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No students in this class
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Register saved.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save register"}
      </Button>
    </form>
  );
}
