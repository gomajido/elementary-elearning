"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { sendRemindersAction, logWaReminderSentAction } from "@/server/controllers/reminder-controller";
import type { ReminderService } from "@/server/services/reminder-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReminderRow = Awaited<ReturnType<typeof ReminderService.eligibleInvoices>>[number];

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

const CHANNEL_LABELS = { whatsapp: "WhatsApp", email: "Email" } as const;

/**
 * A real `<a href target="_blank">` to `wa.me` (opens the admin's own
 * WhatsApp — browser or phone app — with the message prefilled) — not a
 * `window.open()` call, which popup blockers reject even when synchronous,
 * as a real anchor click never is. The log call is fire-and-forget: it
 * can't block or delay the anchor's native navigation.
 */
function SendWaLinkButton({ invoiceId, waLink }: { invoiceId: string; waLink: string }) {
  return (
    <Button
      variant="outline"
      size="xs"
      nativeButton={false}
      render={<a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => logWaReminderSentAction(invoiceId)} />}
    >
      <MessageCircle />
      Buka WhatsApp
    </Button>
  );
}

export function ReminderTable({ rows }: { rows: ReminderRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(rows.filter((r) => r.channel).map((r) => r.invoice.id)));
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof sendRemindersAction>> | null>(null);

  function toggle(invoiceId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) next.delete(invoiceId);
      else next.add(invoiceId);
      return next;
    });
  }

  async function handleSend() {
    setPending(true);
    try {
      const result = await sendRemindersAction([...selected]);
      setResults(result);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {results && (
        <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
          {results.succeeded.length > 0 && (
            <p className="text-emerald-700 dark:text-emerald-400">
              {results.succeeded.length} pengingat terkirim ({results.succeeded.map((s) => s.studentName).join(", ")}).
            </p>
          )}
          {results.failed.length > 0 && (
            <div className="text-destructive">
              <p>{results.failed.length} gagal:</p>
              <ul className="list-inside list-disc">
                {results.failed.map((f, i) => (
                  <li key={i}>
                    {f.studentName || f.invoiceNumber} — {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Siswa</TableHead>
            <TableHead>No. Tagihan</TableHead>
            <TableHead>Sisa Tagihan</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead>Kanal</TableHead>
            <TableHead>Terakhir Diingatkan</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.invoice.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selected.has(row.invoice.id)}
                  disabled={!row.channel}
                  onChange={() => toggle(row.invoice.id)}
                />
              </TableCell>
              <TableCell>
                {row.student.firstName} {row.student.lastName}
              </TableCell>
              <TableCell>{row.invoice.invoiceNumber}</TableCell>
              <TableCell>{formatCents(row.balanceCents)}</TableCell>
              <TableCell>{row.invoice.dueDate}</TableCell>
              <TableCell>
                {row.channel ? (
                  <Badge variant="secondary">{CHANNEL_LABELS[row.channel]}</Badge>
                ) : (
                  <Badge variant="destructive">Tidak ada kontak</Badge>
                )}
              </TableCell>
              <TableCell>
                {row.lastReminder ? new Date(row.lastReminder.createdAt).toLocaleDateString("id-ID") : "—"}
              </TableCell>
              <TableCell>
                {row.channel === "whatsapp" && row.waLink && <SendWaLinkButton invoiceId={row.invoice.id} waLink={row.waLink} />}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Tidak ada tagihan tertunggak
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Button onClick={handleSend} disabled={pending || selected.size === 0} className="w-fit">
        {pending ? "Mengirim…" : `Kirim Pengingat (${selected.size})`}
      </Button>
    </div>
  );
}
