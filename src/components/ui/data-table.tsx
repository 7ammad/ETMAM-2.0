"use client";

import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

/* ── Column Definition ── */
export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

/* ── Table Props ── */
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
  striped?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
}

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  emptyMessage = "لا توجد بيانات",
  className,
  striped = true,
  compact = false,
  stickyHeader = false,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "overflow-auto rounded-lg border border-navy-700",
        className
      )}
    >
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr
            className={cn(
              "border-b border-navy-700 bg-navy-900",
              stickyHeader && "sticky top-0 z-10"
            )}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "text-right font-medium text-navy-300 px-4",
                  compact ? "py-2" : "py-3",
                  col.sortable && "cursor-pointer select-none hover:text-navy-100",
                  col.headerClassName
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && (
                    <span className="shrink-0">
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className={striped ? "table-zebra" : undefined}>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  "border-b border-navy-800 transition-colors",
                  !striped && "hover:bg-navy-800/50",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 text-navy-200",
                      compact ? "py-2" : "py-3",
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(item, idx)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
export type { DataTableProps };
