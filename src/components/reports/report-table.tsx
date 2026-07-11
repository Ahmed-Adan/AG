import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ReportColumn<T> {
  key: keyof T;
  header: string;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
}

export function ReportTable<T extends Record<string, unknown>>({
  columns,
  rows,
  emptyMessage = "No data for the selected filters.",
}: {
  columns: ReportColumn<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.key)} className={col.align === "right" ? "text-right" : ""}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((col) => (
              <TableCell key={String(col.key)} className={col.align === "right" ? "text-right" : ""}>
                {col.render ? col.render(row) : String(row[col.key] ?? "—")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
