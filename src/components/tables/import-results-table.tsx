import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type ImportSucceededRow = { label: string; username?: string; tempPassword?: string };
export type ImportFailedRow = { label: string; error: string };

export function ImportResultsTable({ succeeded, failed }: { succeeded: ImportSucceededRow[]; failed: ImportFailedRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      {succeeded.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Kata Sandi Sementara</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {succeeded.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell>
                    <code className="rounded bg-background px-1.5 py-0.5">{row.username ?? "—"}</code>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-background px-1.5 py-0.5">{row.tempPassword ?? "—"}</code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="px-4 py-2 text-sm text-muted-foreground">
            Bagikan sekarang — kata sandi hanya ditampilkan sekali. Unduh sebagai CSV jika perlu dicetak.
          </p>
        </div>
      )}

      {failed.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kesalahan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {failed.map((row, i) => (
              <TableRow key={i}>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-destructive">{row.error}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
