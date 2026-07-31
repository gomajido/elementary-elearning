import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export type ImportValidRowSummary = { rowNumber: number; label: string };
export type ImportInvalidRowSummary = { rowNumber: number; label: string; errors: string[] };

export function ImportPreviewTable({
  validRows,
  invalidRows,
}: {
  validRows: ImportValidRowSummary[];
  invalidRows: ImportInvalidRowSummary[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{validRows.length} valid</Badge>
        {invalidRows.length > 0 && <Badge variant="destructive">{invalidRows.length} bermasalah</Badge>}
      </div>

      {invalidRows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Baris</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Masalah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invalidRows.map((row) => (
              <TableRow key={row.rowNumber}>
                <TableCell>{row.rowNumber}</TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-destructive">{row.errors.join("; ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {validRows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Baris</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validRows.map((row) => (
              <TableRow key={row.rowNumber}>
                <TableCell>{row.rowNumber}</TableCell>
                <TableCell>{row.label}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
