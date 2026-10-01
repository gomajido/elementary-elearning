"use client";

import { useState } from "react";

import { exportStudentsAction } from "@/server/controllers/registration-controller";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";

export function ExportStudentsButton() {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const { csv } = await exportStudentsAction();
      downloadCsv("data-siswa.csv", [csv]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={pending}>
      {pending ? "Menyiapkan…" : "Ekspor CSV"}
    </Button>
  );
}
