"use client";

import { useEffect, useState } from "react";

import {
  getChildGradesAction,
  getChildAttendanceAction,
  getChildInvoicesAction,
} from "@/server/controllers/parent-controller";
import { AttendanceHistoryTable } from "@/components/tables/attendance-history-table";
import { ChildInvoicesTable } from "@/components/tables/child-invoices-table";
import { ChildGradesTable } from "@/components/tables/child-grades-table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";

type TabValue = "nilai" | "kehadiran" | "biaya";
const TAB_VALUES: TabValue[] = ["nilai", "kehadiran", "biaya"];

function GradesTabContent({ studentId }: { studentId: string }) {
  const [grades, setGrades] = useState<Awaited<ReturnType<typeof getChildGradesAction>> | null>(null);
  useEffect(() => {
    getChildGradesAction(studentId).then(setGrades);
  }, [studentId]);

  if (!grades) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  return <ChildGradesTable grades={grades} />;
}

function AttendanceTabContent({ studentId }: { studentId: string }) {
  const [attendance, setAttendance] = useState<Awaited<ReturnType<typeof getChildAttendanceAction>> | null>(null);
  useEffect(() => {
    getChildAttendanceAction(studentId).then(setAttendance);
  }, [studentId]);

  if (!attendance) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  return <AttendanceHistoryTable rows={attendance} />;
}

function InvoicesTabContent({ studentId }: { studentId: string }) {
  const [invoices, setInvoices] = useState<Awaited<ReturnType<typeof getChildInvoicesAction>> | null>(null);

  function refetch() {
    getChildInvoicesAction(studentId).then(setInvoices);
  }
  useEffect(refetch, [studentId]);

  if (!invoices) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  // A submitted claim doesn't change the balance (unverified payments don't
  // count — see summarizeInvoice), but it should still show up as "Menunggu
  // verifikasi" right away, and the invoice can take another payment (e.g. a
  // second partial transfer) — so this refetches rather than trusting a
  // cached list, same as admin's payments-table always shows current state.
  return <ChildInvoicesTable rows={invoices} onPaymentSubmitted={refetch} />;
}

/**
 * Each tab's data is fetched once, on first activation — not up front for
 * all three (see parent-controller.ts). `visitedTabs` is what makes that
 * "once": a tab's content component only mounts (so its fetch `useEffect`
 * only fires) after the tab has been selected at least once; switching back
 * to an already-visited tab doesn't remount it, so it doesn't refetch.
 */
export function ChildDetailTabs({ studentId, initialTab }: { studentId: string; initialTab: TabValue }) {
  const [visitedTabs, setVisitedTabs] = useState<Set<TabValue>>(new Set([initialTab]));

  function handleValueChange(value: unknown) {
    if (TAB_VALUES.includes(value as TabValue)) {
      setVisitedTabs((prev) => new Set(prev).add(value as TabValue));
    }
  }

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue={initialTab} onValueChange={handleValueChange}>
          <TabsList>
            <TabsTab value="nilai">Nilai</TabsTab>
            <TabsTab value="kehadiran">Kehadiran</TabsTab>
            <TabsTab value="biaya">Biaya</TabsTab>
          </TabsList>

          <TabsPanel value="nilai">
            {visitedTabs.has("nilai") && <GradesTabContent studentId={studentId} />}
          </TabsPanel>
          <TabsPanel value="kehadiran">
            {visitedTabs.has("kehadiran") && <AttendanceTabContent studentId={studentId} />}
          </TabsPanel>
          <TabsPanel value="biaya">
            {visitedTabs.has("biaya") && <InvoicesTabContent studentId={studentId} />}
          </TabsPanel>
        </Tabs>
      </CardContent>
    </Card>
  );
}
