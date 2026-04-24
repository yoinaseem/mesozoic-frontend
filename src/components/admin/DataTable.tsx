"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headClassName?: string;
};

type DataTableState = "loading" | "error" | "empty" | "ready";

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  state: DataTableState;
  getRowId: (row: T) => string | number;
  errorMessage?: ReactNode;
  emptyState?: ReactNode;
  toolbar?: ReactNode;
  pagination?: ReactNode;
  onRowClick?: (row: T) => void;
  loadingRowCount?: number;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  state,
  getRowId,
  errorMessage = "Something went wrong while loading this data.",
  emptyState = "No results.",
  toolbar,
  pagination,
  onRowClick,
  loadingRowCount = 5,
  className,
}: DataTableProps<T>) {
  const colSpan = columns.length;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {toolbar ? <div>{toolbar}</div> : null}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.headClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === "loading" ? (
              Array.from({ length: loadingRowCount }).map((_, rowIndex) => (
                <TableRow key={`loading-${rowIndex}`}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      <Skeleton className="h-4 w-full max-w-[12rem]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : state === "error" ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-8 text-center text-sm text-destructive"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : state === "empty" || rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-0">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination ? <div>{pagination}</div> : null}
    </div>
  );
}
